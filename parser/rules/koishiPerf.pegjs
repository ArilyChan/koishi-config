{{
  
  function defineChain({chain, keyword}){
  	switch (keyword){
    	case 'default':{
        	chain.properties.default = true
            break
        }
        case 'enabled': {
        	chain.properties.enabled = true
            break
        }
        case 'protected': {
        	chain.properties.enabled = false
            break
        }
        default: {
        	throw new Error('unknown keyword: ' + keyword)
        }
    }
  	return chain
  }
  
  function chain({name, block}) {
  	return {
    	type: 'chain',
    	name,
        properties: {
        	default: false,
            enabled: false,
    	},
        plugins: block,
    }
  }
  
  function block({content}){
  	return content.reduce((acc, {plugin, config}) => {
    	acc[plugin] = config
        return acc
    },{})
  }
  
  function pluginConfig ({plugin, config}){
  	return {plugin, config: config?.config, configType: config?.type}
  }
}}
start = (chainstatement / source)*

_dash = [ \t]*
nl = [\n\r\u2028\u2029]

_ = _dash nl* _dash

item = name:([a-zA-Z0-9\-@/])+ {return name.join("")}

default = _dash keyword:"default" _dash next:chainstatement {return defineChain({chain: next, keyword})}
protected = _dash keyword:"protected" _dash next:chainstatement {return defineChain({chain: next, keyword})}
enabled = _dash keyword:"enabled" _dash next:chainstatement {return defineChain({chain: next, keyword})}

chain = _ "chain" _ name:item? _ block:block {return chain({name, block})}
block = _ "{" content:(content)* _ "}" _ {return content}
content = _ item:item _dash config:(yaml / json)? {return pluginConfig({plugin: item, config})}

json = isjson:'json'? _ config:JSON_text {return {config, type: 'json'}}

yaml = "yaml" _dash "{" char:(!"}" .)*  "}" {return {type: 'yaml', config: char.reduce((acc, cur) => acc + cur[1] , "")}}

source = _dash "source" _dash input:([\^a-zA-Z0-9:"'@]+) pipe:(pipe)* _  { return {type: 'connect-source', input: input.join(""), pipe}}
pipe = _dash ">>" _dash output:item { return output }

chainstatement = 
	rtn:(default / protected / enabled / chain)
sourcestatement = source 