_config.yml配置如下：

deploy:
  - type: git
    repo: https://github.com/lxl80/blog.git
    branch: gh-pages
    ignore_hidden: false
  - type: cos
    bucket: lxl80-130****
    region: ap-beijing
    secretId: AKIDh9****F8FvL
    secretKey: Z3IGiur****QZR3PgjXmlVg
    cdnConfig:
      enable: true
      cdnUrl: https://static.lixl.cn
      bucket: static-130****
      region: ap-beijing
      folder: static
      secretId: AKIDh9****F8FvL
      secretKey: Z3IGiur****QZR3PgjXmlVg
————————————————
版权声明：本文为CSDN博主「微笑小星」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。
原文链接：https://blog.csdn.net/tianjuewudi/article/details/112504019