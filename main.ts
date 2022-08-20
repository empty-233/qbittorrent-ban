const config = JSON.parse(Deno.readTextFileSync("./config.json"));

//设置请求头
const commonHeader = {
  Host: config.url,
  Origin: "http://" + config.url,
  Pragma: "no-cache",
  Referer: "http://" + config.url + "/",
  "Accept-Encoding": "gzip, deflate, br",
};

//读取正则
const configMatch = new RegExp(config.match);

//初始化ookie
let cookie: string;

//设置屏蔽规则
const banClient = (client: string): boolean => {
  if (client.match(configMatch)) return true;
  return false;
};

//自定义错误类
class fetchErr extends Error {
  constructor(status: number) {
    super(status.toString());
    this.name = "fetchErr";
    if (status === 403) {
      this.message = "正在尝试重新登录";
      getCookie();
    }
  }
}

//登录获取cookie，并清除旧ip
const getCookie = async () => {
  cookie = (await login())?.headers.get("set-cookie") ?? "";
  console.log("登录成功");
  await setPreferences();
  console.log(`清除旧ip成功`);
};

//登录接口
const login = async () => {
  try {
    const response = await fetch(
      "http://" + config.url + "/api/v2/auth/login",
      {
        method: "POST",
        headers: {
          "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "*/*",
          ...commonHeader,
        },
        body: `username=${config.username}&password=${config.password}`,
      }
    );
    if (!response.ok) throw new Error("登录出错");
    return response;
  } catch (err) {
    console.log(err);
  }
};

//设置接口
const setPreferences = async (): Promise<void> => {
  try {
    const response = await fetch(
      "http://" + config.url + "/api/v2/app/setPreferences",
      {
        method: "POST",
        headers: {
          "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json",
          ...commonHeader,
          cookie,
        },
        body: 'json={"banned_IPs":""}',
      }
    );
    if (!response.ok) throw response.status;
  } catch (err) {
    throw new fetchErr(err);
  }
};

//获取任务列表接口
interface torrents {
  torrents: {
    [prop: string]: string[];
  };
}
const maindata = async (): Promise<{ torrents: torrents }> => {
  try {
    const response = await fetch(
      "http://" + config.url + "/api/v2/sync/maindata",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...commonHeader,
          cookie,
        },
      }
    );
    if (!response.ok) throw response.status;
    return response.json() as Promise<{ torrents: torrents }>;
  } catch (err) {
    throw new fetchErr(err);
  }
};

//获取任务信息接口
interface peers {
  [index: number]: {
    client: string;
    ip: string;
    port: string;
  };
}
const torrentPeers = async (hash: string): Promise<{ peers: peers }> => {
  try {
    const response = await fetch(
      "http://" + config.url + `/api/v2/sync/torrentPeers?hash=${hash}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...commonHeader,
          cookie,
        },
      }
    );
    if (!response.ok) throw response.status;
    return response.json() as Promise<{ peers: peers }>;
  } catch (err) {
    throw new fetchErr(err);
  }
};

//屏蔽接口
const banPeers = async (hash: string, ip: string): Promise<void> => {
  try {
    const response = await fetch(
      "http://" + config.url + "/api/v2/transfer/banPeers",
      {
        method: "POST",
        headers: {
          "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json",
          ...commonHeader,
          cookie,
        },
        body: `hash=${hash}&peers=${ip}`,
      }
    );
    if (!response.ok) throw response.status;
  } catch (err) {
    throw new fetchErr(err);
  }
};

interface peersValues {
  client: string;
  ip: string;
  port: string;
}

getCookie();
//初始化函数
const main = async () => {
  try {
    const missions = (await maindata()).torrents;
    const hashList: string[] = Object.keys(missions);
    hashList.map(async (hash:string) => {
      const peers: peersValues[] = Object.values(
        (await torrentPeers(hash)).peers
      );
      if (!peers) return;
      const banIps: string[] = peers
        .filter((peer) => banClient(peer.client))
        .map((peer) => `${peer.ip}:${peer.port}`);
      const ip:string = banIps.join("|");
      await banPeers(hash, ip);
      if (ip) console.log(`屏蔽ip: ${ip}`);
    });
  } catch (err) {
    console.log(err);
  }
};
//定时调用
setInterval(() => {
  try {
    main();
  } catch (err) {
    console.log(err);
  }
}, 1000 * config.date);
