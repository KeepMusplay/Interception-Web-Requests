var modeHack = false; // for debug and forgery requests

const oldConsoleLog = console.log;

// forbid invoke logs from others scripts(*optional)
console.log = () => {};
console.warn = () => {};
console.error = () => {};

// new class for renderers in console
class Console
{
    static WriteLine(message, mode = Console.Colors.Ordinary, typeData = 0)
    {
	    switch(mode)
        {
            case Console.Colors.Ordinary:
                oldConsoleLog(message);
                break;

            case Console.Colors.XMLHttpRequest:
                if(typeData == 0)
                    oldConsoleLog('%c↑ XMLHttpRequest', `color: ${Console.Colors.XMLHttpRequest}; font-size: 10px; background: #000000;`, message);
                else
                    oldConsoleLog('%c↓ XMLHttpRequest', `color: ${Console.Colors.XMLHttpRequest}; font-size: 10px; background: #000000;`, message);
                break;

            case Console.Colors.fetch:
                if(typeData == 0)
                    oldConsoleLog('%c↑ fetch', `color: ${Console.Colors.fetch}; font-size: 10px; background: #000000;`, message);
                else
                    oldConsoleLog('%c↓ fetch', `color: ${Console.Colors.fetch}; font-size: 10px; background: #000000;`, message);
                break;

            case Console.Colors.WebSocket:
                if(typeData == 0)
                    oldConsoleLog('%c↑ WebSocket', `color: ${Console.Colors.WebSocket}; font-size: 10px; background: #000000;`, message);
                else
                    oldConsoleLog('%c↓ WebSocket', `color: ${Console.Colors.WebSocket}; font-size: 10px; background: #000000;`, message);
                break;
        }
    }

    static Colors = {
 	    XMLHttpRequest: "#FFFF33",
 	    fetch: "#FF00FF",
        WebSocket: "#00FFFF",
        Ordinary: ""
    };
}


// in hack mode we can change arguments for forgery request
var hackArgs;
const oldFetch = fetch;

// override method for obtain control under send
fetch = async function()
{
    if(arguments.length > 1)
        Console.WriteLine(arguments[1].body, Console.Colors.fetch, 0);

    hackArgs = arguments;
    if(modeHack)
    {
        debugger;
        // renderer replaced body request
        Console.WriteLine(arguments[1].body, Console.Colors.fetch, 0);
    }

    let response = await oldFetch(...hackArgs);
    // so that the caller can once again read ReadableStream
    let hackResponse = response.clone();
    let dataFetch = await hackResponse.text();
    Console.WriteLine(dataFetch, Console.Colors.fetch, 1);
    return response;
}


var hackSocket;
class MyNewWebSocket extends WebSocket
{
    constructor(...params)
    {
        super(...params);
        hackSocket = this;
    }
}

WebSocket = MyNewWebSocket;

(function regListener()
{
    if(hackSocket?.onmessage == undefined)
    {
        setTimeout( regListener, 200 );
        return;
    }

    const oldOnMessage = hackSocket.onmessage;
    hackSocket.onmessage = function(...params)
    {
        Console.WriteLine(params[0].data, Console.Colors.WebSocket, 1);
        oldOnMessage.call(hackSocket, ...params);
    }

    const oldSend = hackSocket.send;
    hackSocket.send = function(...params)
    {
        Console.WriteLine(params[0].data, Console.Colors.WebSocket, 0);
	if(modeHack)
	{
	    debugger;
        Console.WriteLine(params[0].data, Console.Colors.WebSocket, 0);
	}
        return oldSend.call(hackSocket, ...params);
    }
})();


var hackParams;
class MyXMLHttpRequest extends XMLHttpRequest
{
    constructor()
    {
        super();
    }

    send(...params)
    {
    	Console.WriteLine(params[0], Console.Colors.XMLHttpRequest, 0);
        hackParams = params[0];
        if(modeHack)
	    {
	        debugger;
    	    Console.WriteLine(params[0], Console.Colors.XMLHttpRequest, 0);
	    }
        super.send(...params);
        this.getResponse(this);
        return;
    }

    getResponse(t)
    {
        if(t.readyState == 4)
            Console.WriteLine(t.response, Console.Colors.XMLHttpRequest, 1);
        else
            setTimeout(t.getResponse, 100, t);
    }
}

XMLHttpRequest = MyXMLHttpRequest;
