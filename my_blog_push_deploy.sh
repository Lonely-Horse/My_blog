#!/usr/bin/bash
set -Eeuo pipefail

Work_dir="${HOME}/work/My_blog"
cd ${Work_dir}

version="${1:-}"

if [ -z "$version" ]; then
    read -rp "请输入版本号:" version
fi
if [ -z "$version" ]; then
    echo "版本号不能为空"
    exit 1
fi

Image_address="100.87.250.21:5000"
Image_name="blog_local"
Image_latest="${Image_address}/${Image_name}:latest"
Image_version="${Image_address}/${Image_name}:${version}"
T630_HOST="lonelyhorse@100.87.126.53"
T630_DEPLOY_SCRIPT="${HOME}/My_blog/pull_deploy.sh"
t630_blog_address="${HOME}/My_blog"
ssh_key="${HOME}/.ssh/ser7_to_t630_deploy"
ssh_opts="-i ${ssh_key} -o BatchMode=yes"

echo "拉取远程 tag..."
git fetch origin tag "$version"
build_dir="/tmp/my_blog_build_${version}"

cleanup(){
    if [ -n "${build_dir}" ] && [ -d "${build_dir}" ]; then
        echo "清理临时推送目录: ${build_dir}"
        git -C "${Work_dir}" worktree remove --force "${build_dir}" 2>/dev/null || true
        rm -rf "${build_dir}" 2>/dev/null || true
    fi
}
trap cleanup EXIT

echo "清理旧的临时目录"
if [ -d "${build_dir}" ]; then
    git -C "${Work_dir}" worktree remove --force "${build_dir}" 2>/dev/null || true 
    rm -rf "${build_dir}" 2>/dev/null || true
fi

echo "创建临时构建目录: ${build_dir}"
git -C "${Work_dir}" worktree add --detach "${build_dir}" "refs/tags/${version}"
cd "${build_dir}"

echo "现在开始原地构建镜像,并打好标签"
docker build \
  -t "${Image_latest}" \
  -t "${Image_version}" \
  .

echo "现在开始推送镜像到本地regustry仓库"

docker push ${Image_latest}
docker push ${Image_version}

echo "镜像推送完毕"

echo "开始rsync同步文件"
rsync -av -e "ssh ${ssh_opts}" ./posts/ "${T630_HOST}:${t630_blog_address}/posts/"
rsync -av -e "ssh ${ssh_opts}" ./notes/ "${T630_HOST}:${t630_blog_address}/notes/"

echo "静态文件完成同步"

echo "触发 T630 部署..."
ssh "${ssh_opts}" "$T630_HOST" "bash ${T630_DEPLOY_SCRIPT} '${version}'"
