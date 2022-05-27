var last_time = new Date();

function dd_mm_yy(date) {
    // Convert data
    var dd = date.getDate();
    if (dd < 10) dd = '0' + dd;

    // Convert month
    var mm = date.getMonth() + 1;
    if (mm < 10) mm = '0' + mm;

    // convert year
    var yy = date.getFullYear();
    if (yy < 10) yy = '0' + yy;

    // convert hours
    var hh = date.getHours() - 3;
    if (hh < 10) hh = '0' + hh;

    // convert minutes
    var min = date.getMinutes();
    if (min < 10) min = '0' + (min);

    // convert seconds
    var ss = date.getSeconds();
    if (ss < 10) ss = '0' + ss;

    return {'dd': dd, 'mm': mm, 'yy': yy, 'hh': hh, 'min': min, 'ss': ss}
}

function formatDate(date) {
    let mass_data = dd_mm_yy(date);  // Get formatted data from function dd_mm_yy
    // Return data in the following format dd.mm.yyy hh:mm:ss
    return mass_data['dd'] + '.' + mass_data['mm'] + '.' + mass_data['yy'] + ' ' + mass_data['hh'] + ':' + mass_data['min'] + ':' + mass_data['ss'];
}

function requestDate(date) {
    let mass_data = dd_mm_yy(date);  // Get formatted data from function dd_mm_yy
    // Return data in the following format yyy.mm.ddThh:mm:ss
    return mass_data['yy'] + '-' + mass_data['mm'] + '-' + mass_data['dd'] + 'T' + mass_data['hh'] + ':' + mass_data['min'] + ':' + mass_data['ss'];
}

// Create the function to upload new data
function upload_data(config) {
    if (config.data.datasets.length > 0) {  // If there is at least 1 dataset
        data = new FormData();  // Initialize data class
        data.append('ticker_name', $('select[name="tname"]').val());  // Send ticker name
        data.append('isData', 'new_data');  // Inform that we need only new data
        data.append('last_time', last_time);  // last time we got the price
        let d = new Date();  // Set variable for a date
        $.ajax({  // Create a function to get data asynchronously
          type: 'POST',  // Sent data format
          dataType: "json",  // Type of data
          url: '/',  // server path
          data: data,  // Form data
          contentType: false,
          processData: false,
          success: function(data) {  // If we got a reverse request
              for (var i in data) {  // Process received data
                d = new Date(data[i]['time']);  // Date
                d.setHours(d.getHours() - 3);  // Convert time according to the server time
                last_time_format = new Date(last_time)  //
                if (d > last_time_format) {  // Check if we got the new data
                    config.data.labels.push(formatDate(d));  // If we got them, add the date to graph
                    config.data.datasets.forEach(function (dataset) {  // and as we have only 1 dataset, add price
                        dataset.data.push(data[i]['price']);
                    });
                    window.myLine.update();  // Update graph
                }
                d.setHours(d.getHours() + 3);  // Return date UTC + 3 hours
                last_time = requestDate(d);  // Update date for the last price
              }
          },
          error: function(request, status, error) {  // If there is a server mistake log is sent into browser console
              console.log(request.responceText+" "+status+" "+error+" ");
          }
        });
      }
    }

// Create function to upload all the prices saved in database
function get_full_data() {
    data = new FormData();  // initialize data class
    data.append('ticker_name', $('select[name="tname"]').val());  // Send ticker name
    data.append('isData', 'full_data');  // Inform that we need all the ticker data
    labels = [];  // Create an empty massive to fill temporary data in it
    dataPrices = [];  // Create an empty massive to fill price in it
    $.ajax({
        type: 'POST',  // Sending data format
        dataType: "json",  // Data type
        url: '/',  // server path
        data: data,  // form data
        contentType: false,
        processData: false,
        success: function(data) {
            let d = new Date();  // set variable for a date
            // Process the received data and fill them into earlier created massives
            for (var i in data) {
                d = new Date(data[i]['time']);
                labels.push(formatDate(d));
                dataPrices.push(data[i]['price']);
                last_time = requestDate(d);
            }
            var ctx = document.getElementById('myChart').getContext('2d');  // Get object id from html,where the graph will be

            // config for Chart
            var config = {
                    // Тип графика
                    type: 'line',
                    // Создание графиков
                    data: {
                        // Точки графиков
                        labels: labels,
                        fill: false,
                        // График
                        datasets: [{
                            label: 'График цены тикера', // Название
                            backgroundColor: 'transparent', // Цвет закраски
                            borderColor: 'rgb(255,99,132)', // Цвет линии
                            data: dataPrices // Данные каждой точки графика
                        },]
                    },

                    // Настройки графиков
                    options: {
                        responsive: true,
                        title: {
                            display: true,
                            text: 'Линейный график'
                        },
                        tooltips: {
                            mode: 'index',
                            intersect: false,
                        },
                        hover: {
                            mode: 'nearest',
                            intersect: true
                        },
                        scales: {
                            xAxes: [{
                                display: true,
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Date'
                                }
                            }],
                            yAxes: [{
                                display: true,
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Price'
                                },
                                ticks: {
                                    min: -50,
                                    max: 50,

                                    // forces step size to be 5 units
                                    stepSize: 5
                                }
                            }]
                        }
                    }
                };
            window.myLine = new Chart(ctx, config);  // Create and insert the graph into the page

            // Form the function to upload data from the server repeatedly
            setInterval(function() { upload_data(config); }, 1000);
        },
        error: function(request, status, error) {
            console.log(request.responceText+" "+status+" "+error+" ");
        }
    });
}

    $(document).ready(function() {
        get_full_data();  // Get data and graph for default ticker
        $('#tname').on('change', function () {  // If we choose other product, rebuild the graph for the new product
            get_full_data();  // Get data and graph for the new ticker
        })
    });