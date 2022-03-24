- tokens

default # root Context， 默认链。复数default生命会被合并。在其他链处理完全部消息后会由default处理。因为必须是protected所以不需要显式声明protected。
drop # 类型为chain，发送到drop的消息会被丢弃
enabled # 黑名单插件组合，假设没有enabled, chain就是白名单插件组合。
protected # 白名单插件组合，　不需要显式声明
chain [name] {  # 插件处理责任链, 声明default的chain会自动获得名字”default”， chain也可以被当作source处理，会包含所有未被处理的消息。
    [plugin] <JSON Plugin.options>
}
source [^]<filter> >> <chain.name> # “^”会从context中去掉filter的上下文

- more tokens

let | const <vairableName> = <value> # 定义变量/常量
for [let | const] <variable> in <Iterable> { # for in loop
    
}

- mock

default chain {
    @koishijs/plugin-onebot {
    }
}

default chain admin {
    some-danger-plugin {
        ‘rm -rf /’ : true
    }
}


enabled chain a {
    koishi-plugin-genshin {
        …options
    }
}


protected chain disabled {
    @koishijs/plugin-manager
}
source onebot:879724291 > admin

source ^discord:1234567 > default

for const id in [1,2,3] {
    source ^onebot:${id} > a
}
source a > drop # chain a 处理后的消息会不经过default chain直接被丢弃

source onebot:4 > a > admin > drop # 这个感觉会有点难 大概没有也行。