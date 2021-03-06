/* global it */

if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                                 ? this
                                 : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

function toTitleCase(str)
{
    // insert a space before all caps
    return str.replace(/([A-Z])/g, ' $1')
    // uppercase the first character
    .replace(/^./, function(str){ return str.toUpperCase(); });
}

/*function story(str) {
    var container = function(inner) {
        describe('\n\x1b[33m    Scenario: ' + str, function() {
            inner();
        });
    };
    
    return {
        given: given.bind(null, container)
    };
}

function given(parent, func) {
    if(func) {
        var name = toTitleCase(func.name);
        var args = createArguments(arguments, 2);

        var container = function(inner) {
            parent(function() {
                describe('\x1b[35mGiven ' + name + args.argStr, function() {
                    beforeEach(function() {
                        func.apply(null, args.args);
                    });

                    inner();            
                });
            });
        };
    } else {
        var container = function(inner) {
            parent(inner);
        };
    }
    
    return {
        and: and.bind(null, container),
        when: when.bind(null, container)
    };
}

function when(parent, func) {
    var name = toTitleCase(func.name);
    var args = createArguments(arguments, 2);
    
    var container = function(inner) {
        parent(function() {
            describe('\x1b[35mWhen ' + name + args.argStr, function() {
                beforeEach(function() {
                    func.apply(null, args.args);
                });
            
                inner();    
            });
        });
    };
    
    return {
        then: then.bind(null, container),
        and: and.bind(null, container)
    };
}

function then(parent, func) {
    var name = toTitleCase(func.name);
    
    var thens = [];
    
    var args = createArguments(arguments, 2);
    
    thens.push(function() {
        it('Then ' + name + args.argStr, function() {
            func.apply(null, args.args);           
        });       
    });
    
    var container = function() {
        parent(function() {
            for(var i = 0; i < thens.length; i++) {
                thens[i]();
            }
        });
    };
    
    return {
        and: andArray.bind(null, container, thens),
        execute: execute.bind(null, container)
    };
}

function and(parent, func) {
    var name = toTitleCase(func.name);
    var args = createArguments(arguments, 2);
    
    var container = function(inner) {
        parent(function() {
            describe('\x1b[35mand ' + name + args.argStr, function() {
                beforeEach(function() {
                    func.apply(null, args.args);
                });
            
                inner();
            });
        });
    };
    
    return {
        and: and.bind(null, container),
        when: when.bind(null, container)
    };
}

function execute(parent) {
    parent();
}

function andArray(container, thens, func) {
    var name = toTitleCase(func.name);
    
    var args = createArguments(arguments, 3);
    
    thens.push(function() {
        it('and ' + name + args.argStr, function() {
            func.apply(null, args.args);           
        });       
    });
    
    return {
        and: andArray.bind(null, container, thens),
        execute: execute.bind(null, container)
    };
}*/

function createTitle(scenario, funcs) {
    var title = scenario + '\n';
    
    for(var i = 0; i < funcs.length; i++) {
        title += '        ' + funcs[i].title;
        
        if(i < funcs.length - 1) {
            title += '\n';
        }
    }
    
    return title;
}

function execute(scenario, store, timeout, funcs) {
    var title = createTitle(scenario, funcs);
    
    it(title, function() {
        for(var j = 0; j < funcs.length; j++) {
            funcs[j].func();
        }   
    });
}

function executeAsync(scenario, store, timeout, funcs) {
    var title = createTitle(scenario, funcs);
    
    it(title, function(done) {
        if(timeout) {
            this.timeout(timeout);
        }
        
        var j = 0;
        
        var next = function() {
            j++;
            
            if(j < funcs.length) {
                funcs[j].func(store, next);
                return;
            }
            
            done();
        };
        
        funcs[0].func(store, next);
    });
}

function story(str) {
    return storyBase(execute, str);
}

function storyAsync(str, timeout) {
    var store = {};
    return storyBase(executeAsync, str, store, timeout);
}

function storyBase(exec, str, store, timeout) {
    var scenario = '\x1b[33mScenario: ' + str;
    var funcs = [];

    var thenAndReturn = {
        execute: exec.bind(null, scenario, store, timeout, funcs)
    };
    
    var andStr = '    \x1b[35mand ';
    
    var thenAnd = storyItemBase.bind(null, andStr, funcs, thenAndReturn);
    
    thenAndReturn.and = thenAnd;
    
    var then = storyItemBase.bind(null, '\x1b[35mThen ', funcs, {
        and: thenAnd,
        execute: exec.bind(null, scenario, store, timeout, funcs)
    }); 
    
    var whenAnd = storyItemBase.bind(null, andStr, funcs, {
        then: then
    });
    
    var when = storyItemBase.bind(null, '\x1b[35mWhen ', funcs, {
        and: whenAnd,
        then: then
    });
    
    var givenAndReturn = {
        when: when
    };
    
    var givenAnd = storyItemBase.bind(null, andStr, funcs, givenAndReturn);
    
    givenAndReturn.and = givenAnd;
    
    var given = storyItemBase.bind(null, '\x1b[35mGiven ', funcs, {
        and: givenAnd,
        when: when
    });
    
    return {
        given: given
    };
}

function storyItemBase(title, funcs, returnType, func) {
    if(func) {
        var name = toTitleCase(func.name);
        var args = createArguments(arguments, 4);

        funcs.push({
            title: title + name + args.argStr,
            func: function(store, next) {
                
                if(next) {
                    args.args.splice(0, 0, next);
                }
                
                if(store) {
                    args.args.splice(0, 0, store);
                }
                
                func.apply(null, args.args);
            }
        });
    }
    
    return returnType;
}

function createArguments(args, start) {
    var argStr = '';
    var argArray = [];
    
    if(args.length > start) {
        argStr = [];
        for(var i = start; i < args.length; i++) {
            var arg = args[i];
            if(isObjLiteral(arg)) {
                argStr.push(JSON.stringify(arg));
            } else {
                argStr.push(arg);
            }
            
            argArray.push(arg);
        }
        
        argStr = ' (' + argStr.join(', ') + ')';
    }
    
    return {
        args: argArray,
        argStr: argStr
    };
}

function isObjLiteral(_obj) {
  var _test  = _obj;
  return (  typeof _obj !== 'object' || _obj === null ?
              false :  
              (
                (function () {
                  while (!false) {
                    if (  Object.getPrototypeOf( _test = Object.getPrototypeOf(_test)  ) === null) {
                      break;
                    }      
                  }
                  return Object.getPrototypeOf(_obj) === _test;
                })()
              )
          );
}