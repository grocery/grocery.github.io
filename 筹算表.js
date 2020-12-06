//hotInstance.colToProp(), prop refers to the prop name set under column:[{data:prop, ...}, {data:prop, ...}]
//prop is used when data source is an array of objects

var hotTables = [];
var hcDataPages = [];

var searchFieldText, saveButtonText, exportButtonText, jsonParseError, dataSavedText, saveErrorText, loadErrorText, eFileName;
var baseColor, tableScheme;

//下为激战百科站所设，对其他百科站无用
var scRenderers = []
//上为激战百科站所设，对其他百科站无用

Handsontable.renderers.registerRenderer('groceryDefaultRenderer', groceryDefaultRenderer);
Handsontable.renderers.registerRenderer('groceryDropdownRenderer', groceryDropdownRenderer);
Handsontable.renderers.registerRenderer('groceryCurrencyRenderer', groceryCurrencyRenderer);
Handsontable.renderers.registerRenderer('groceryCheckboxRenderer', groceryCheckboxRenderer);
Handsontable.renderers.registerRenderer('productImageRenderer', productImageRenderer);
Handsontable.renderers.registerRenderer('internalLinkRenderer', internalLinkRenderer); //registering renderers here b/c calling templates can only pass objects with whose value fields are strings | can't use the cellsFunction example below b/c it's too much trouble to parse this far down the column specifications, which is where these renderers are used

displayHOTable()

function displayHOTable(){

  $( ".筹算表" ).each(function( hotableIndex ) {
 
        searchFieldText = "搜索";
        saveButtonText = "存档";
        exportButtonText = "导出";
        jsonParseError = "参数格式有误";
        dataSavedText = "储存成功";
        saveErrorText = "储存失败";
        loadErrorText = "装载失败";
        eFileName = "筹算表";

        baseColor = false;
        tableScheme = false;
 
        //missing data and colheaders
        //columnSorting: true, | may have conflict with multiColumnSorting:true
        /*colWidths: 100,
          colWidths: '100px',
          colWidths: [100, 120, 90],
          colWidths: function(index) {
            return index * 10;
          },*/
        var hotableParameters =  {
            afterLoadData: function(initialLoad){
                this.render()
            },
            contextMenu: true,       
            colHeaders: true,
            rowHeaders: true,                            
            formulas: true,
            comments: true,
            search: true,
            multiColumnSorting: true,
            language: "zh-CN",
            licenseKey: "non-commercial-and-evaluation",
            manualColumnMove: true,
            manualRowMove: true,
            className: "htCenter htMiddle",
            afterSetCellMeta: function (row, col, key, val) {
                console.log("cell meta changed", row, col, key, val);
            },
            beforePaste: function (data, coords) {                
                // data -> [[1, 2, 3], [4, 5, 6]]
                //data.splice(0, 1);
                // data -> [[4, 5, 6]]
                // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
 
                for(var ii = 0; ii < data.length; ii++) {                    
                    for(var jj = 0; jj < data[ii].length; jj++) {
                        data[ii][jj] = String(data[ii][jj]).trim()
                    }
                }
                
            }
        }
 
        var hotableCustomParameters = strip_tags($(this).children("#canshu").text(),'');        
        
        var thisDataPage;
 
        try {            
            var hpJSON = JSON.parse(hotableCustomParameters)            
            thisDataPage = hpJSON.data            
            hcDataPages.push(thisDataPage)            
            delete hpJSON.data; //delete hpJSON["data"]

            var cellsFunction = {}
            if (hpJSON.hasOwnProperty("cells")) {
                  cellsFunction = {cells: eval(strip_tags(hpJSON.cells, ""))}
                  $.extend( hotableParameters, cellsFunction)
                  delete hpJSON.cells; //delete hpJSON["cells"]
            }

            $.extend( hotableParameters, hpJSON )
            
            console.log(hotableParameters)
 
            if (hpJSON.hasOwnProperty('language') && hpJSON.language == "en-US"){
                searchFieldText = "Search";
                saveButtonText = "Save";
                exportButtonText = "Export";                
                jsonParseError = "JSON Parse Error";
                dataSavedText = "Data Saved";
                saveErrorText = "Save Error";
                loadErrorText = "Load Error";
                eFileName = "MyFile";
            }
 
        } catch (e) {
            console.log(e)
            alert(jsonParseError+"\r\n"+hotableCustomParameters);
        }
       
        var iControlDiv = document.createElement('div');
        iControlDiv.innerHTML = "<input id ='输入"+(hotableIndex+1)+"' type='search' placeholder='"+searchFieldText+"'> \
                                 <button id = '导出"+(hotableIndex+1)+"' style='float:right'>"+exportButtonText+"</button> \
                                 <button id = '存档"+(hotableIndex+1)+"' style='float:right'>"+saveButtonText+"</button>";
        $(this).prepend(iControlDiv);       
        
        var fSearch = document.getElementById('输入'+(hotableIndex+1))        
        var bSave = document.getElementById('存档'+(hotableIndex+1))
        var bExport = document.getElementById('导出'+(hotableIndex+1))
 
 
        //javascript selectors don't use prefixes such as '#' or '.'; javascript functions use function names to indicate the type of search
        //jquery .first() returns a jquery object, which can be chained with more jquery methods; the return value is NOT a DOM node; 
        //To obtain the DOM node, use .get(0) or [0], which is equivalent to the javascript: document.getElementBy__("tag")
        
        hotTables.push(new Handsontable($(this).children("#neirong").get(0), hotableParameters))

        var queryData = {
            action: 'parse',
            format: 'json',
            prop: 'wikitext',
            page: thisDataPage
        };
        
        //"this" is not affected by lexical scopes like other variables; its value only depends on how the function was called, not how/when/where it was defined
        //easy solution: declare a normal variable "self", which obeys lexical scope rules and is accessible inside the callback
        var self = this;
        
        //use iffy to hang on to hotableIndex
        requestWithCallback(queryData, (function() {            
            return function(res) {                       
                $(self).children("#daizai").remove()                
                hotTables[hotableIndex].loadData(JSON.parse(res.parse.wikitext['*']).data);   
             }
          })(), 'GET', function(res) {alert(loadErrorText);});
 
        //Search field; use iffy to hang on to hotableIndex
        (function() {            
            return Handsontable.dom.addEvent(fSearch, 'keyup', function(event) {                
                var search = hotTables[hotableIndex].getPlugin('search');
                var queryResult = search.query(this.value);              
                //console.log(queryResult);
                hotTables[hotableIndex].render();
            });
        })();
 
        //Save button; use iffy to hang on to hotableIndex
        (function() {            
            return Handsontable.dom.addEvent(bSave, 'click', function() {                
                console.log(JSON.stringify({data: hotTables[hotableIndex].getSourceData()}));            
                var queryData = {
                format: 'json',
                action: 'edit',
                contentformat: 'application/json',
                title: hcDataPages[hotableIndex],
                summary: "数据更新",
                text: JSON.stringify({data: hotTables[hotableIndex].getSourceData()}),
                minor: true,
                token: mw.user.tokens.get('csrfToken')
                };
                requestWithCallback(queryData, function(res) {alert(dataSavedText);}, 'POST', function(res) {alert(saveErrorText);});            
            });
        })();        
 
        //Export button; use iffy to hang on to hotableIndex
        (function() {            
            return Handsontable.dom.addEvent(bExport, 'click', function() {
                var exportPlugin = hotTables[hotableIndex].getPlugin('exportFile');
                exportPlugin.downloadFile('csv', {
                    fileExtension: 'xlsx',
                    filename: eFileName+'-[YYYY]-[MM]-[DD]'
                });
            });
        })();
 
    });
} 


function groceryCells(row, col, prop){

  var cellProperties = {};

  switch (col) {
    case 0: //选购
      cellProperties.checkedTemplate = "买"
      cellProperties.uncheckedTemplate = "不买"
      cellProperties.editor = "checkbox"
      cellProperties.colWidths = "50px"
      cellProperties.renderer = "groceryCheckboxRenderer"
      break;
    case 1: //定量
      //cellProperties.type = "dropdown"
      cellProperties.editor = "dropdown"
      cellProperties.source = [0, 1, 2, 3, 4, 5]
      cellProperties.renderer = "groceryDropdownRenderer"
      break;
    case 3: //名目
      cellProperties.renderer = "internalLinkRenderer"
      break;
    case 4: //图
      cellProperties.readOnly = true
      cellProperties.renderer = "productImageRenderer"
      break;
    case 8:
      cellProperties.numericFormat = {
            "pattern": "$0,0.00",
            "culture": "en-US"
      }
      cellProperties.allowEmpty = false
      cellProperties.renderer = "groceryCurrencyRenderer"
      break;
    case 9:
      cellProperties.checkedTemplate = "已购"
      cellProperties.uncheckedTemplate = "未购"
      cellProperties.editor = "checkbox"
      cellProperties.colWidths = "50px"
      cellProperties.renderer = "groceryCheckboxRenderer"
      break;
    default: //2 备注, 5 种类, 6 店, 7 架位
      cellProperties.renderer = "groceryDefaultRenderer"
  }

  /* this.instance.toVisualRow(row);  this.instance.toVisualColumn(column);  this.instance.toPhysicalColumn this.instance.toPhysicalRow */

  return cellProperties;
}

// original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
function strip_tags(input, allowed) {
  var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
    commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;

  // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
  allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');

  return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
    return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
  });
}

function safeHtmlRenderer(instance, td, row, col, prop, value, cellProperties) {
  var escaped = Handsontable.helper.stringify(value);
  escaped = strip_tags(escaped, '<em><b><strong><a><big>'); //be sure you only allow certain HTML tags to avoid XSS threats (you should also remove unwanted HTML attributes)
  td.innerHTML = escaped;

  return td;
}

function groceryBackgroundColor(instance, row, col){
  //antiquewhite floralwhite lightfloral lightcyan lightskyblue linen lightgreen mediumaquamarine mediumseagreen
  if (instance.getDataAtCell(row, 9) == "已购"){
     return "mediumaquamarine"
  } 
  if (instance.getDataAtCell(row, 0) == "买") {
     return "antiquewhite"
  }
}

function groceryCurrencyRenderer(instance, td, row, col, prop, value, cellProperties) {
  td.style["background-color"] = groceryBackgroundColor(instance, row, col)
  Handsontable.renderers.NumericRenderer.apply(this, arguments)
  //return td;
}

function groceryCheckboxRenderer(instance, td, row, col, prop, value, cellProperties) {
  td.style["background-color"] = groceryBackgroundColor(instance, row, col)
  Handsontable.renderers.CheckboxRenderer.apply(this, arguments)
  //td.style["width"] = "50px"
  //return td;
}

function groceryDropdownRenderer(instance, td, row, col, prop, value, cellProperties) {
  td.style["background-color"] = groceryBackgroundColor(instance, row, col)
  Handsontable.renderers.DropdownRenderer.apply(this, arguments)
  //return td;
}

function groceryDefaultRenderer(instance, td, row, col, prop, value, cellProperties) {
  td.style["background-color"] = groceryBackgroundColor(instance, row, col)
  Handsontable.renderers.TextRenderer.apply(this, arguments)
  //return td;
}

function internalLinkRenderer(instance, td, row, col, prop, value, cellProperties) {

  var zeroth = instance.getDataAtCell(row, 0);
  var last = instance.getDataAtCell(row, 9);
  if (last == "已购"){
     td.style["background-color"] = "mediumaquamarine"
  } else if (zeroth == "买") {
     td.style["background-color"] = "antiquewhite"
  }

  var escaped = Handsontable.helper.stringify(value);
  escaped = strip_tags(escaped, ''); //be sure you only allow certain HTML tags to avoid XSS threats (you should also remove unwanted HTML attributes)
  td.innerHTML = "<a href = '/wiki/" + escaped + "' target = '_blank'>" + escaped + "</a>";
  td.className = "htCenter htMiddle";
  //return td;
}

function productImageRenderer(instance, td, row, col, prop, value, cellProperties) {

  var zeroth = instance.getDataAtCell(row, 0);
  var last = instance.getDataAtCell(row, 9);
  if (last == "已购"){
     td.style["background-color"] = "mediumaquamarine"
  } else if (zeroth == "买") {
     td.style["background-color"] = "antiquewhite"
  }

  var escaped = Handsontable.helper.stringify(instance.getDataAtCell(row, (col-1)));
  escaped = strip_tags(escaped, ''); //be sure you only allow certain HTML tags to avoid XSS threats (you should also remove unwanted HTML attributes)

  var img = document.createElement('IMG');
  img.style.width = "100px";
  var imgExt = ".jpg";
  var imgName = escaped + imgExt;
  //var imgNameMD5 = md5(imgName);

  img.src = imgName; //"https://huiji-public.huijistatic.com/guildwars/uploads/" + imgNameMD5.substr(0,1) + "/" + imgNameMD5.substr(0,2) + "/" +

  Handsontable.dom.addEvent(img, 'mousedown', function (e){
    e.preventDefault(); // prevent selection quirk
  });

  Handsontable.dom.empty(td); //during initialization, since default is 5 rows, this function will be called 5 times, from 0 to 4, when cell values are still null. Not clearing the product of these unnecessary calls will result in multiple non existent images being appended to the cell
  td.className = "htCenter htMiddle";
  td.appendChild(img);
  //return td;
}


function coverRenderer (instance, td, row, col, prop, value, cellProperties) {
  var escaped = Handsontable.helper.stringify(value),
    img;

  if (escaped.indexOf('http') === 0) {
    img = document.createElement('IMG');
    img.src = value;

    Handsontable.dom.addEvent(img, 'mousedown', function (e){
      e.preventDefault(); // prevent selection quirk
    });

    Handsontable.dom.empty(td);
    td.appendChild(img);
  }
  else {
    // render as text
    Handsontable.renderers.TextRenderer.apply(this, arguments);
  }

  return td;
}

function requestWithCallback(queryData, callback, reqType, errCallback) {
    if (!reqType) {
        reqType = 'GET';
    }
    if (!errCallback) {
        errCallback = function() {
            console.log('请求过程中出现错误！');
        }
    }
    $.ajax({
        url: '/api.php',
        data: queryData,
        type: reqType,
        dataType: 'json',
        cache: false,
        timeout: 10000,
        error: function(xhr) {
            if (typeof (errCallback) === 'function') {
                errCallback(xhr);
            }
        },
        success: function(data) {
            if (typeof (callback) === 'function') {
                callback(data);
            }
        }
    });
}