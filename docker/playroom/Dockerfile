FROM node:18-slim

# 使用国内镜像源，避免被墙
RUN npm config set registry https://registry.npmmirror.com

# 安装 playroom server
RUN npm install -g @playroom/server

ENV PORT=4000
EXPOSE 4000

CMD ["playroom-server", "--port", "4000", "--cors", "*"]