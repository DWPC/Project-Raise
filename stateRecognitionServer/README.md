curl -d image='start' localhost:3000

curl -d name='nakanishi' -d position=0 http://localhost:3000
curl -d name='mizuta' -d position=1 http://localhost:3000
curl -d name='kaeru' -d position=2 http://localhost:3000
curl -d name='kaga' -d position=3 http://localhost:3000
curl -d name='shou' -d position=4 http://localhost:3000



curl -d image='3s' http://localhost:3000
curl -d image='Ac' http://localhost:3000
curl -d image='5d' http://localhost:3000
curl -d image='Qh' http://localhost:3000
curl -d image='3d' http://localhost:3000
curl -d image='6c' http://localhost:3000
curl -d image='6s' http://localhost:3000
curl -d image='7h' http://localhost:3000
curl -d image='8c' http://localhost:3000
curl -d image='Kh' http://localhost:3000
curl -d image='5s' http://localhost:3000
curl -d image='Ah' http://localhost:3000

curl -d image='7c' http://localhost:3000
curl -d image='Kd' http://localhost:3000
curl -d image='3c' http://localhost:3000
curl -d image='4c' http://localhost:3000
curl -d image='9s' http://localhost:3000
curl -d image='7d' http://localhost:3000
curl -d image='8s' http://localhost:3000
curl -d image='As' http://localhost:3000

curl -d image='preFlop' http://localhost:3000

curl -d image='2s' http://localhost:3000
curl -d image='4h' http://localhost:3000
curl -d image='Jd' http://localhost:3000
curl -d image='2c' http://localhost:3000
curl -d image='Js' http://localhost:3000

curl -d image='nextGame' localhost:3000


curl -d type='sitOut' -d position=4 localhost:3000

curl -i 'http://localhost:3000?callback=jsonpcallinback'





curl -d name='vivil' -d position=0 http://157.7.200.224:3000
curl -d name='kokuyou' -d position=1 http://157.7.200.224:3000
curl -d name='nanokuro' -d position=2 http://157.7.200.224:3000
curl -d name='drAAgon' -d position=3 http://157.7.200.224:3000
curl -d name='hkoeda' -d position=4 http://157.7.200.224:3000
curl -d name='nekonjp' -d position=5 http://157.7.200.224:3000
curl -d name='deflis' -d position=6 http://157.7.200.224:3000
curl -d name='koukix' -d position=7 http://157.7.200.224:3000
curl -d name='TORI' -d position=8 http://157.7.200.224:3000
curl -d name='komlow' -d position=0 http://157.7.200.224:3000





curl -d image='start' http://157.7.200.224:3000

curl -d image='3s' http://157.7.200.224:3000
curl -d image='Ac' http://157.7.200.224:3000
curl -d image='5d' http://157.7.200.224:3000
curl -d image='Qh' http://157.7.200.224:3000
curl -d image='3d' http://157.7.200.224:3000
curl -d image='6c' http://157.7.200.224:3000
curl -d image='6s' http://157.7.200.224:3000
curl -d image='7h' http://157.7.200.224:3000
curl -d image='8c' http://157.7.200.224:3000
curl -d image='Kh' http://157.7.200.224:3000
curl -d image='5s' http://157.7.200.224:3000
curl -d image='Ah' http://157.7.200.224:3000
curl -d image='7c' http://157.7.200.224:3000
curl -d image='Kd' http://157.7.200.224:3000
curl -d image='3c' http://157.7.200.224:3000
curl -d image='7c' http://157.7.200.224:3000
curl -d image='9s' http://157.7.200.224:3000
curl -d image='7h' http://157.7.200.224:3000
curl -d image='8c' http://157.7.200.224:3000
curl -d image='As' http://157.7.200.224:3000

curl -d image='preFlop' http://157.7.200.224:3000

curl -d image='2s' http://157.7.200.224:3000
curl -d image='4h' http://157.7.200.224:3000
curl -d image='Jd' http://157.7.200.224:3000
curl -d image='2c' http://157.7.200.224:3000
curl -d image='Js' http://157.7.200.224:3000



次にすること
フロップ以降も確認すること。
インストールの仕方をまとめること。


npm init これでpackage.jsonを作成してくれる。
npm install --save-dev http
npm install --save-dev request
npm install --save-dev querystring
npm install --save-dev url
--save-devはinstallしたlibraryの情報を自動でpackage.jsonに書いてくれるoptionです
$ npm install
オプション無しで、npm installを実行すると、package.jsonの内容に従って、packageをインストールします。



curl localhost:9000?hoge='fuga'


{
    "state": "preFlop",
    "allPlayersNum": 3,
    "playingPlayersNum": 3,
    "foldPlayerPosition": null,
    "board": [],
    "players": [
        {
            "position": 0,
            "isActive": true,
            "winningPercentage": "18.2",
            "chopPercentage": "1.2",
            "hand" :["2s", "7c"]
        },
        {
            "position": 1,
            "isActive": true,
            "winningPercentage": "60.8",
            "chopPercentage": "0.3",
            "hand" :["As", "Ac"]
        },
        {
            "position": 2,
            "isActive": true,
            "winningPercentage": "22.8",
            "chopPercentage": "1.2",
            "hand" :["Jh", "Kh"]
        }
    ]
}


送った返しに今の状態を返して欲しい。
jupitersky