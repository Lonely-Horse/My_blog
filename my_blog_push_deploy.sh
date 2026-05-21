#!/usr/bin/bash
set -Eeuo pipefail

Work_dir="/home/lonelyhorse/work/My_blog"
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
T630_DEPLOY_SCRIPT="/home/lonelyhorse/My_blog/pull_deploy.sh"

echo "拉取远程 tag..."
git fetch origin tag "$version"

echo "切换到发布版本: $version"
git checkout -f "refs/tags/$version"


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

rsync -av ./posts/ lonelyhorse@100.87.126.53:/home/lonelyhorse/My_blog/posts
rsync -av ./notes/ lonelyhorse@100.87.126.53:/home/lonelyhorse/My_blog/notes

echo "静态文件完成同步"

echo "触发 T630 部署..."
ssh -i ~/.ssh/ser7_to_t630_deploy -o BatchMode=yes "$T630_HOST" "bash $T630_DEPLOY_SCRIPT '$version'"
