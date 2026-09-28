// カードを追加するときは、この配列に1行足すだけでOKです（id は重複しない番号に）。
// category: auth / smb / mail / web / infra / iot / ot / remote / file / mobile
const PORTS = [
  { id: 1,  service: "FTP",              port: "21",   usage: "ファイル転送",              category: "file",   note: "データ転送は20。20番台連番の先頭(21→22→23→25)" },
  { id: 2,  service: "SSH",              port: "22",   usage: "暗号化リモート接続",        category: "remote", note: "Telnet(23)の暗号版" },
  { id: 3,  service: "Telnet",          port: "23",   usage: "平文リモート接続",          category: "remote", note: "平文で盗聴に弱い。暗号版がSSH(22)" },
  { id: 4,  service: "SMTP",            port: "25",   usage: "メール送信",                category: "mail",   note: "VRFY=存在確認/EXPN=リスト展開" },
  { id: 5,  service: "DNS",             port: "53",   usage: "名前解決/ゾーン転送",       category: "infra",  note: "解決はUDP53、ゾーン転送(axfr)はTCP53" },
  { id: 6,  service: "HTTP",            port: "80",   usage: "Web(平文)",                 category: "web",    note: "暗号版はHTTPS(443)" },
  { id: 7,  service: "Kerberos",        port: "88",   usage: "認証(認証チケットTGT/TGS)", category: "auth",   note: "DC特定は88+389セット" },
  { id: 8,  service: "POP3",            port: "110",  usage: "メール受信",                category: "mail",   note: "110が先、IMAP(143)が後" },
  { id: 9,  service: "NTP",             port: "123",  usage: "時刻同期",                  category: "infra",  note: "SNMP(161)と数字が近く紛らわしい" },
  { id: 10, service: "RPC (Endpoint Mapper)", port: "135", usage: "MS RPC",             category: "infra",  note: "Windowsの各種RPCの入口" },
  { id: 11, service: "NetBIOS Name",    port: "137",  usage: "NetBIOS名前サービス",       category: "smb",    note: "名前=137(UDP)" },
  { id: 12, service: "NetBIOS Session (旧SMB)", port: "139", usage: "NetBIOS経由の旧SMB", category: "smb",   note: "旧SMB。現行の直接SMBは445" },
  { id: 13, service: "IMAP",            port: "143",  usage: "メール受信",                category: "mail",   note: "POP3(110)より後の番号" },
  { id: 14, service: "SNMP",            port: "161",  usage: "機器管理",                  category: "infra",  note: "Trapは162。public=RO/private=RW。NTP(123)と混同注意" },
  { id: 15, service: "LDAP",            port: "389",  usage: "ディレクトリ検索",          category: "auth",   note: "D=Directory=検索。暗号版はLDAPS(636)" },
  { id: 16, service: "HTTPS",           port: "443",  usage: "Web(暗号化)",               category: "web",    note: "HTTP(80)の暗号版" },
  { id: 17, service: "SMB (Direct Host)", port: "445", usage: "Windowsファイル共有(現行)", category: "smb",   note: "現行の直接SMB。NetBIOS経由の旧SMBは139" },
  { id: 18, service: "Modbus",          port: "502",  usage: "ICS/SCADA制御",             category: "ot",     note: "産業制御。Shodanでport:502探索" },
  { id: 19, service: "LDAPS",           port: "636",  usage: "暗号化LDAP",                category: "auth",   note: "LDAP(389)の暗号版" },
  { id: 20, service: "MQTT",            port: "1883", usage: "IoTメッセージング(平文)",   category: "iot",    note: "TLS版は8883" },
  { id: 21, service: "MQTT over TLS",   port: "8883", usage: "IoTメッセージング(暗号)",   category: "iot",    note: "MQTT平文(1883)の暗号版" },
  { id: 22, service: "NFS",             port: "2049", usage: "Unix系ファイル共有",        category: "file",   note: "Windows共有はSMB(445)" },
  { id: 23, service: "RDP",             port: "3389", usage: "リモートデスクトップ",       category: "remote", note: "Windows。よく攻撃対象になる" },
  { id: 24, service: "ADB",             port: "5555", usage: "Android無線デバッグ",        category: "mobile", note: "外部公開=重大リスク。Shodanで探索される" }
];

// 裏面のメモを強調表示する（特に間違えやすい）ポート
const HIGHLIGHT_PORTS = ["88", "389", "445"];
