# 介绍

qBittorrent 屏蔽客户端，可以自定义需要屏蔽的客户端

采用 ts+deno

可以使用任意版本的 qbittorrent (只要支持webUI，接口和官方一样即可)

# 安装运行

## 下载

```
wget https://github.com/shenchous/qBittorrent-ban/archive/refs/heads/main.zip
unzip qBittorrent-ban
```



## 安装

官方文档: https://deno.land/manual/getting_started/installation

```
curl -fsSL https://deno.land/x/install/install.sh | sh
```

运行

```
cd qBittorrent-ban
run --allow-all main.ts
```

## 配置文件

编辑根目录下的 **config.json**

```json
{
    //webui地址
    "url": "127.0.0.1:8080",
    //用户名
    "username": "admin",
    //密码
    "password": "adminadmin",
    //屏蔽规则(正则)
    "match": "(-XL0012-)|(Xunlei)|(^7\\.)|(QQDownload)",
    //间隔时间(秒)
    "date": "60"
}
```



## 守护进程(可选)

安装 npm,并使用 npm 安装 pm2

```
//Ubuntu
apt update
apt install npm 
npm install -g pm2
```

目前 pm2 还没支持 deno ，不过我们可以借助 PM2 运行非 Node.js 脚本，所以可以将其用于 Deno

```
cd qBittorrent-ban
pm2 start main.ts --interpreter="deno" --interpreter-args="run --allow-all"
```

开机自启

```
pm2 save
pm2 startup
```

