$(function(){
    //stored memo
    chrome.storage.sync.get('memo', function(storage){
        $('#memo').val(storage.memo);
    });
    // chrome.storage.sync.remove("todo");
    
    //In Dev channel - can be implemented in the future
    // chrome.identity.getAccounts(function(userInfo) {
    //     /* Use userInfo.email, or better (for privacy) userInfo.id
    //        They will be empty if user is not signed in in Chrome */
    //     console.log(userInfo);
    // });

    var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };
      
      function success(pos) {
        var crd = pos.coords;
      
        console.log('Your current position is:');
        console.log('Latitude : ' + crd.latitude);
        console.log('Longitude: ' + crd.longitude);
        console.log('More or less' + crd.accuracy + ' meters.');

        $.get("https://samples.openweathermap.org/data/2.5/weather?lat=45&lon=-73&appid=b65508a232c076df17008e774ebe6df1", function( data ) {
            console.log(data);
          });
      }
      
      function error(err) {
        console.warn('ERROR(${err.code}): ${err.message}');
      }
      
      navigator.geolocation.getCurrentPosition(success, error, options);

    // remove finished items exist more than one day
    chrome.storage.sync.get('time', function(storage){
        if (storage.hasOwnProperty('time')){
            var lastTime = storage.time;
            var curTime = new Date();
            var dif = curTime.getTime() - lastTime;
            if (dif > 86400000) {
                chrome.storage.sync.get('todo', function(storage){
                    var todoItems = storage.todo;
                    $.each(todoItems, function(key, value){
                        if (value == 'done'){
                            delete todoItems[key];
                        }
                    });

                    chrome.storage.sync.set({'todo': todoItems})
                });
                chrome.storage.sync.set({'time': curTime.getTime()}, function(){});
            }
        } else {
            var time = new Date();
            chrome.storage.sync.set({'time': time.getTime()});
        }
    });

    //get stored todo items
    chrome.storage.sync.get('todo', function(storage){
        // console.log(storage.todo);
        if (storage.hasOwnProperty('todo')){
            var items = storage.todo;
            $.each(items, function( key, value ) {
                var newElement = $('<li class="todoLi" ><input type="checkbox">' + key + '</li>');
                $("#todoList").append(newElement);
                if (value == 'done') {
                    newElement.css("text-decoration", "line-through");
                    newElement.css("color", "grey");
                    newElement.children().prop( "checked", true );
                }
            });
        }
    });

    startTime();

    $('#newTodo').hide();

    $('#searchBtn').click(function(){
        var searchUrl = "https://www.google.com/search?q=" + $('#search').val();
        var createData = {
            "url": searchUrl
        };
        chrome.tabs.create(createData, function(){});
        close();
    });

    $('#search').keypress(function (e) {
        var key = e.which;
        if(key == 13)  // the enter key code
         {
           $('#searchBtn').click(); 
         }
    }); 
    
    //memo button
    $('#memoLbl').click(function(){
        if ($('#memoLbl').text() != 'Save'){
            if ($('#memo').css("opacity") != '0'){
                $('#memo').css("opacity", '0');
                $('#memoLbl').text("+ MEMO");
            } else {
                $('#memo').css("opacity", '0.8');
                $('#memoLbl').text("- MEMO");
            }
        } else if ($('#memoLbl').text() == 'Save') {
            var memoText = $('#memo').val();
            chrome.storage.sync.set({'memo': memoText}, function(){
                $('#memoLbl').text("- MEMO");
            });
            
        }
        
    });

    $('#memo').keyup(function (){
        $('#memoLbl').text("Save");
    });
    
    //change the status of a todo task
    $('ol').on('click', 'li.todoLi', function(){
        
        if($(this).children().is(":checked")){
            $(this).css("text-decoration", "line-through");
            $(this).css("color", "grey");

            // get the text of the li and set the accroding status in chrome storage to 'done'
            var key = $(this).text();
            chrome.storage.sync.get('todo', function(storage){
                var items = storage.todo;
                items[key] = 'done';
                chrome.storage.sync.set({'todo': items}, function(){})
            });
        } else if($(this).children().is(":not(:checked)")){ //unchecked
            $(this).css("text-decoration", "");
            $(this).css("color", "white");

            var key = $(this).text();
            chrome.storage.sync.get('todo', function(storage){
                var items = storage.todo;
                items[key] = 'new';
                chrome.storage.sync.set({'todo': items}, function(){})
            });
        }
    });

    //addTodo
    $('#addTodo').click(function(){
        $('#addTodo').hide();
        $('#newTodo').show();
        $('#newTodo').focus();
    });

    $('#newTodo').keypress(function (e) {
        var key = e.which;
        if(key == 13)  // the enter key code
        {
            var newTodo = $('#newTodo').val();
            chrome.storage.sync.get('todo', function(storage){
                var items = storage.hasOwnProperty('todo') ? storage.todo : {}; 
                if (items.hasOwnProperty(newTodo)){
                    alert(newTodo + " already existed!");
                    $('#newTodo').val("");
                } else {
                    //frotend
                    $('#addTodo').show();
                    $('#newTodo').hide();
                    $("#todoList").append('<li class="todoLi"><input type="checkbox">' + newTodo + '</li>');
                    $('#newTodo').val("");

                    //backend
                    items[newTodo] = "new";
                    chrome.storage.sync.set({'todo': items}, function() {
                        if (chrome.runtime.lastError)
                            console.log(chrome.runtime.lastError);
                        else
                            console.log("History saved successfully");
                    });
                }
            });            
        }
    });

    //todo button
    $('#todoBtn').click(function(){
        if ($('#todoWrapper').css("opacity") != '0'){
            $('#todoWrapper').css("opacity", '0');
            $('#todoBtn').text("+ TODO");
        } else {
            $('#todoWrapper').css("opacity", '0.8');
            $('#todoBtn').text("- TODO");
        }        
    });
})

window.setInterval(function(){
    startTime();
}, 500);

function startTime() {
    var weekday=new Array(7);
    weekday[0]="Sunday";
    weekday[1]="Monday";
    weekday[2]="Tuesday";
    weekday[3]="Wednesday";
    weekday[4]="Thursday";
    weekday[5]="Friday";
    weekday[6]="Saturday";
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth() + 1;
    var date = today.getDate();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    var day = today.getDay();
    h = checkTime(h);
    m = checkTime(m);
    s = checkTime(s);
    month = checkTime(month);
    date = checkTime(date);
    $('#time').text(h + ":" + m + ":" + s);
    $('#date').text(year + '-' + month + '-' + date);
    $('#day').text(weekday[day]);

    if (h<6) {
        $('#greet').text('Good Evening!');
    }else if (h < 12) {
        $('#greet').text('Good Monrning!');
    }else if (h < 17) {
        $('#greet').text('Good Afternoon!');
    }else if (h < 20) {
        $('#greet').text('Good Evening!');
    }else {
        $('#greet').text('Good Night!');
    }
}

function checkTime(i) {
    if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
}