/*
*    ED ToolBox, a companion web app for the video game Elite Dangerous
*    (C) 1984 - 2015 Frontier Developments Plc.
*    ED ToolBox or its creator are not affiliated with Frontier Developments Plc.
*
*    Copyright (C) 2016 Mauri Kujala (contact@edtb.xyz)
*
*    This program is free software; you can redistribute it and/or
*    modify it under the terms of the GNU General Public License
*    as published by the Free Software Foundation; either version 2
*    of the License, or (at your option) any later version.
*
*    This program is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU General Public License for more details.
*
*    You should have received a copy of the GNU General Public License
*    along with this program; if not, write to the Free Software
*    Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA
*/

var zindexmax = 100000;

function slide()
{
	var sliderOptions =
	{
	  currentMargin: 0,
	  marginSpeed: -10
	};
	var s = $('#ltitle');

	if (s.width() >= 198)
	{
		value = s.width() - 194;
		s.css("right",value+"px");
	}
}

function slideout()
{
	var sliderOptions =
	{
	  currentMargin: 0,
	  marginSpeed: -10
	};
	var s = $('#ltitle');

	if (s.width() >= 198)
	{
		s.css("right","0px");
	}
}

// http://papermashup.com/read-url-get-variables-withjavascript/
function getUrlVars()
{
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value)
    {
        vars[key] = value;
    });
    return vars;
}

var requestno = 0;
// function to update current system and log every so often -->
function get_data(override)
{
    var override = override || false;

    if (override == true) {
        requestno = 0;
    }

	system_id = getUrlVars()["system_id"];
	system_name = getUrlVars()["system_name"];
    // get system info and log
    $.ajax(
    {
        url: "/get/getData.php?request="+requestno+"&system_id="+system_id+"&system_name="+system_name,
        cache: false,
        dataType: 'json',
        success: function(result)
        {
            var returnedvalue = result;

            $('#nowplaying').html(result['now_playing']);

            if (result['renew'] != "false")
            {
                $('#t1').html(result['system_title']);
                $('#systeminfo').html(result['system_info']);
                $('#scrollable').html(result['log_data']);
                $('#stations').html(result['station_data']);

				// if we're on the system info page
                if (document.getElementById('system_page'))
                {
                    $('#si_name').html(result['si_name']);
					$('#si_stations').html(result['si_stations']);
					$('#si_detailed').html(result['si_detailed']);
                }

                if (document.getElementById('container'))
                {
                    var chart = $('#container').highcharts()

                    if (chart)
                    {
                        $('#container').highcharts().destroy();
                    }
                    var mode = getUrlVars()["mode"];
                    var maxdistance = getUrlVars()["maxdistance"];
                    var script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.src ="/get/getMapPoints.js.php?mode="+mode+"&maxdistance="+maxdistance;

                    $('head').append(script);
                }
				if (result['update_map'] != "false")
				{
					$.ajax(
					{
						url: "/get/getMapPoints.json.php",
						cache: false,
						dataType: 'html',
						success: function()
						{
							//console.log('success')
						}
					});
				}
            }
            requestno = 1;
        }
    });
}

$(function()
{
    get_data();
});
/*
// function for systems.php
function get_system_data()
{
	if (document.getElementById('systemsdata'))
	{
		sort = getUrlVars()["sort"];

		$.ajax(
		{
			url: "/get/getSystemsData.php?sort="+sort,
			cache: false,
			dataType: 'json',
			success: function(result)
			{
				var returnedvalue = result;

				$('#systemsdata').html(result['systemsdata']);
			}
		});
	}
}

$(function()
{
    get_system_data();
});
*/
// function to get the current system when called -->
function get_cs(formid, coordformid, onlyid)
{
    coordformid = coordformid || false;
	onlyid = onlyid || false;
    $.ajax({
        url: "/get/getData.php?action=onlysystem",
        cache: false,
        success: function(result)
        {
            var returnedvalue = result;
            $('#'+formid).val(returnedvalue);
        }
    });
    if (coordformid !== false)
    {
        $.ajax({
            url: "/get/getData.php?action=onlycoordinates",
            cache: false,
            success: function(results)
            {
                var returnedvalues = results;
                $('#'+coordformid).val(returnedvalues);

				// split coordinates for ditance calculations
				var res = returnedvalues.split(",");
				var x = res[0];
				var y = res[1];
				var z = res[2];
				$('#coordsx_2').val(x);
				$('#coordsy_2').val(y);
				$('#coordsz_2').val(z);

            }
        });
    }
    if (onlyid !== false)
    {
        $.ajax({
            url: "/get/getData.php?action=onlyid",
            cache: false,
            success: function(results)
            {
                var returnedvalues = results;
                $('#'+onlyid).val(returnedvalues);
            }
        });
    }
}

// function to update data for system editing
function update_values(editurl, deleteid)
{
    deleteid = deleteid || false;
    $.ajax({
        url: editurl,
        cache: false,
        dataType: 'json',
        success: function(result)
        {
            jQuery.each(result, function(id, value)
            {
                if (document.getElementById(id).type == "checkbox")
                {
                    if (value == 0) {
                        //document.getElementById(id).checked="false";
                    }
                    else {
                        document.getElementById(id).checked="true";
                    }
                }
                else if (document.getElementById(id).type == "select")
                {
					document.getElementById(id).getElementsByTagName('option')[value].selected = 'selected'
                }
                else
                {
                    $('#'+id).val(value);
                }

            });
        }
    });

    if (document.getElementById('delete'))
    {
        document.getElementById('delete').innerHTML = '';
        if (deleteid !== false)
        {
            document.getElementById('delete').innerHTML = '<a href="javascript:void(0);" onclick="confirmation('+deleteid+',\'log\')"><input class="delete_button" type="button" value="Delete log entry" style="width:125px;margin-left:10px;"></a>';
        }
    }

    if (document.getElementById('delete_poi'))
    {
        document.getElementById('delete_poi').innerHTML = '';
        if (deleteid !== false)
        {
            document.getElementById('delete_poi').innerHTML = '<a href="javascript:void(0);" onclick="confirmation('+deleteid+',\'poi\')"><input class="delete_button" type="button" value="Delete POI entry" style="width:125px;margin-left:10px;"></a>';
        }
    }

    if (document.getElementById('delete_bm'))
    {
        document.getElementById('delete_bm').innerHTML = '';
        if (deleteid !== false)
        {
            document.getElementById('delete_bm').innerHTML = '<a href="javascript:void(0);" onclick="confirmation('+deleteid+',\'bm\')"><input class="delete_button" type="button" value="Delete Bookmark" style="width:125px;margin-left:10px;"></a>';
        }
    }

    /*if (document.getElementById('delete_station'))
    {
        document.getElementById('delete_station').innerHTML = '';
        if (deleteid !== false)
        {
            document.getElementById('delete_station').innerHTML = '<a href="javascript:void(0);" onclick="confirmation('+deleteid+',\'station\')"><input class="button" type="button" value="Delete station" style="width:125px;margin-left:120px;"></a>';
        }
    }*/
}

// function to update data (poi, log, what have you)
function update_data(formid, file, update_map)
{
	update_map = update_map || false;
    var allTags = document.getElementById(formid).elements;
    var data_to_send = { };

    for (var tg = 0; tg< allTags.length; tg++)
    {
        var tag = allTags[tg];
        if (tag.name)
        {
            if (tag.type == "checkbox")
            {
                if (tag.checked)
                {
                    data_to_send[tag.name] = (tag.value);
                }
                else
                {
                    data_to_send[tag.name] = "";
                }
            }
            else
            {
                data_to_send[tag.name] = (tag.value);
            }
        }
    }
    //console.log(data_to_send);
    var st = JSON.stringify(data_to_send)
    $.ajax({
        type: "POST",
        url: file,
        data: { input: st}
    })
    .done(function( msg )
	{
        if (msg)
		{
            alert(msg);
        }
        else
		{
            var system_requests = 0;
            document.getElementById('seslogsuccess').innerHTML = '<img src="/style/img/check.png">';
            setTimeout(function()
            {
                document.getElementById('seslogsuccess').innerHTML = '';
            }, 3000);
        }
    });

	if (update_map == true)
	{
		$.ajax(
		{
			url: "/get/getMapPoints.json.php",
			cache: false,
			dataType: 'html',
			success: function()
			{
				//console.log('success')
			}
		});
	}
}

function addZero(i)
{
    if (i < 10) {

        i = "0" + i;
    }
    return i;
}

// function to update the clock
function startTime()
{
    var today=new Date();
    var h=addZero(today.getHours());
    var m=today.getMinutes();
    var s=today.getSeconds();
    var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
    var d=today.getDate();
    var year=today.getFullYear()+1286;
    var mo=monthNames[today.getMonth()];
    m = checkTime(m);
    s = checkTime(s);

    document.getElementById('hrs').innerHTML = h+":"+m+":"+s;
    document.getElementById('date').innerHTML = d+" "+mo+" "+year;
    var t = setTimeout(function(){startTime()},500);
}

function checkTime(i)
{
    if (i<10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
}
/*  */

// confirmation popup
function confirmation(delid, what)
{
    if (confirm("Sure you want to delete a thing?") == true)
    {
        var location = "";
        if (what == "log")
            var location = "/add/log.php?do&deleteid="+delid;
        else if (what == "poi")
            var location = "/add/poi.php?do&deleteid="+delid;
        else if (what == "bm")
            var location = "/add/bookmark.php?do&deleteid="+delid;
       /* else if (what == "station")
            var location = "/add/station.php?deleteid="+delid;
        else if (what == "system")
            var location = "/add/systemE.php?deleteid="+delid;*/

        if (location != "")
        {
            $.ajax({
                url: location,
                cache: false,
                success: function(result)
                {
                    console.log(delid+' a thing was deleted');
                }
            });
        }
    }
    get_data(true);
    tofront('null', true);
}

// get info from clicking on a map point
var last_system = "";
function get_mi(system)
{
    if (last_system == system)
    {
        document.getElementById('report').style.display = "none";
    }
    else
    {
        document.getElementById('report').style.display = "block";
        $.ajax({
        url: "/get/getMapData.php?system="+system,
        cache: false,
        success: function(result)
        {
            var returnedvalue = result;
            $('#report').html(returnedvalue);
        }
        });
    }
    last_system = system;
}

// autocomplete scripts for adding points of interest
function showResult(str, divid, link, station, idlink, sysid, dp)
{
	link = link || "no";
	idlink = idlink || "no";
	station = station || "no";
	sysid = sysid || "no";
	dp = dp || "no";

    if (str.length>=2)
    {
        document.getElementById("suggestions_"+divid).style.display="block";
    }
    else
        document.getElementById("suggestions_"+divid).style.display="none";

    if (window.XMLHttpRequest)
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new XMLHttpRequest();
    } else {  // code for IE6, IE5

    }
        xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState==4 && xmlhttp.status==200) {
            document.getElementById("suggestions_"+divid).innerHTML=xmlhttp.responseText;
        }
    }

	allegiance = getUrlVars()["allegiance"];
	system_allegiance = getUrlVars()["system_allegiance"];
	power = getUrlVars()["power"];

	addtolink = "";
	addtolink2 = "";
	addtolink3 = "";

	if (system_allegiance != "undefined")
		addtolink = "&system_allegiance="+system_allegiance;

	if (allegiance != "undefined")
		addtolink2 = "&allegiance="+allegiance;

	if (power != "undefined")
		addtolink3 = "&power="+power;

	if (station == "yes") {
		xmlhttp.open("GET","/get/getStationNames.php?q="+str+"&divid="+divid+"&link="+link+"&idlink="+idlink+"&sysid="+sysid+"&dp="+dp+addtolink+addtolink2+addtolink3,true);
	}
	else {
		xmlhttp.open("GET","/get/getSystemNames.php?q="+str+"&divid="+divid+"&link="+link+"&idlink="+idlink+"&sysid="+sysid+"&dp="+dp+addtolink+addtolink2+addtolink3,true);
	}
    xmlhttp.send();
}

// now change the value to the selected one
function setResult(result, coordinates, divid)
{
    $('#system_'+divid).val(result);
	var str = coordinates;
	var res = str.split(",");
	var x = res[0];
	var y = res[1];
	var z = res[2];

    $('#coordsx_'+divid).val(x);
	$('#coordsy_'+divid).val(y);
	$('#coordsz_'+divid).val(z);
    document.getElementById("suggestions_"+divid).style.display="none";
}
function setbm(name, sysid)
{
    $('#bm_system_name').val(name);
	$('#bm_system_id').val(sysid);
	document.getElementById("suggestions_3").style.display="none";
}
function setl(name, stationid)
{
    $('#statname').val(name);
	//$('#station_id').val(stationid);
	document.getElementById("suggestions_41").style.display="none";
}
function setdp(name, coordinates, systemid)
{
    $('#system_name').val(name);
	$('#system_id').val(systemid);
	var str = coordinates;
	var res = str.split(",");
	var x = res[0];
	var y = res[1];
	var z = res[2];
	$('#x').val(x);
	$('#y').val(y);
	$('#z').val(z);
	document.getElementById("suggestions_37").style.display="none";
}

function toinput(system, coordinates, price, tonnage, to, id)
{
	if (to == "from_system")
	{
		$('#from_system').val(system);
		$('#from_coords').val(coordinates);
		$('#price1').val(price);
		$('#tonnage').val(tonnage);
		$('#from_id').val(id);
	}
	else if (to == "to_system")
	{
		$('#to_system').val(system);
		$('#to_coords').val(coordinates);
		$('#price2').val(price);
		$('#tonnage').val(tonnage);
		$('#to_id').val(id);
	}
}

function hailait(name, to)
{
	var x = document.getElementsByName(name);
	var i;

	if (to == "buy")
	{
		var buys = document.getElementsByClassName("station_info_price_info_highlight");
		var is;
		for (is = 0; is < buys.length; is++)
		{
			buys[is].className="station_info_price_info";
		}
		for (is = 0; is < buys.length; is++)
		{
			buys[is].className="station_info_price_info";
		}
		for (is = 0; is < buys.length; is++)
		{
			buys[is].className="station_info_price_info";
		}
		for (is = 0; is < buys.length; is++)
		{
			buys[is].className="station_info_price_info";
		}
		//
		for (i = 0; i < x.length; i++)
		{
			x[i].className="station_info_price_info_highlight";
		}
	}
	else if (to == "sell")
	{
		var sells = document.getElementsByClassName("station_info_price_info_highlight2");
		var isa;
		for (isa = 0; isa < sells.length; isa++)
		{
			sells[isa].className="station_info_price_info";
		}
		for (isa = 0; isa < sells.length; isa++)
		{
			sells[isa].className="station_info_price_info";
		}
		for (isa = 0; isa < sells.length; isa++)
		{
			sells[isa].className="station_info_price_info";
		}
		for (isa = 0; isa < sells.length; isa++)
		{
			sells[isa].className="station_info_price_info";
		}
		//
		for (i = 0; i < x.length; i++)
		{
			x[i].className="station_info_price_info_highlight2";
		}
	}
}

function empty()
{
	document.getElementById('from_system').value='';
	document.getElementById('to_system').value='';
	document.getElementById('to_coords').value='';
	document.getElementById('from_coords').value='';
	document.getElementById('distance_mp').value='';
	document.getElementById('return').value='';

	var cases = document.getElementsByClassName("station_info_price_info_highlight");
	var num = 0;
	for (num = 0; num < cases.length; num++)
	{
		cases[num].className="station_info_price_info";
	}
	for (num = 0; num < cases.length; num++)
	{
		cases[num].className="station_info_price_info";
	}
	for (num = 0; num < cases.length; num++)
	{
		cases[num].className="station_info_price_info";
	}
	for (num = 0; num < cases.length; num++)
	{
		cases[num].className="station_info_price_info";
	}

	var cases2 = document.getElementsByClassName("station_info_price_info_highlight2");
	var num2 = 0;
	for (num2 = 0; num2 < cases2.length; num2++)
	{
		cases2[num2].className="station_info_price_info";
	}
	for (num2 = 0; num2 < cases2.length; num2++)
	{
		cases2[num2].className="station_info_price_info";
	}
	for (num2 = 0; num2 < cases2.length; num2++)
	{
		cases2[num2].className="station_info_price_info";
	}
	for (num2 = 0; num2 < cases2.length; num2++)
	{
		cases2[num2].className="station_info_price_info";
	}
}

// function to calculate distances
function calcDist(coord_fromx, coord_fromy, coord_fromz, coord_tox, coord_toy, coord_toz, from, to, price1, price2, tonnage, to_id, from_id)
{
	price1 = price1 || "";
	price2 = price2 || "";
	tonnage = tonnage || "160";
	to_id = to_id || "";
	from_id = from_id || "";

    //var coor_from = coord_from.split(",");

    var x1 = coord_fromx;
    var y1 = coord_fromy;
    var z1 = coord_fromz;

    //var coor_to = coord_to.split(",");

    var x2 = coord_tox;
    var y2 = coord_toy;
    var z2 = coord_toz;

	if (document.getElementById("distance_mp") && document.getElementById("to_system").value != "" && document.getElementById("from_system").value != "")
	{
		profit = 0;
		profit = price2 - price1;
		overall = profit * tonnage;

		document.getElementById('distance_mp').value = ''+Math.round(Math.sqrt(Math.pow((x1-(x2)),2)+Math.pow((y1-(y2)),2)+Math.pow((z1-(z2)),2)))+' ly and '+profit+' CR/t, '+overall+' CR for '+tonnage+' t';

		$.ajax({
			url: "/get/getReturnTrip.php?from="+from_id+"&to="+to_id+"&tonnage="+tonnage,
			cache: false,
			success: function(result)
			{
				if (result != "false") {
					$('#return').val(result);
				}
			}
		});
	}

	if (x1 && x2 && y1 && y2 && z1 && z2)
	{
		if (to == "")
			document.getElementById('dist_display').value = 'Missing information, try again';
		else
			document.getElementById('dist_display').value = 'The distance from '+from+' to '+to+' is '+Math.round(Math.sqrt(Math.pow((x1-(x2)),2)+Math.pow((y1-(y2)),2)+Math.pow((z1-(z2)),2)))+' ly';
	}
	else
	{
		document.getElementById('dist_display').value = 'Missing information, try again';
	}
}

// function to add station to log form
function addstation(station, station_id)
{
    document.getElementById("statname").value=station;
	document.getElementById("station_id").value=station_id;
}

// function to save session log
function savelog(log)
{
    var data = this.document.getElementById('logtext').value;
    $.ajax({
      type: "POST",
      url: "/add/sessionLogSave.php",
      data: { logtext: data }
    })
    .done(function( msg )
	{
        document.getElementById('seslogsuccess').innerHTML = '<img src="/style/img/check.png">';

        setTimeout(function()
        {
			if (document.getElementById('seslogsuccess').innerHTML == '<img src="/style/img/check.png">')
			{
				document.getElementById('seslogsuccess').innerHTML = '';
			}

        }, 3000);
    });
}
function showsave()
{
    document.getElementById('seslogsuccess').innerHTML = '<a href="javascript:void(0);" onclick="savelog()" title="Save session log"><img src="/style/img/save.png"></a>'
}
/*  */

// function to shove affected div to the front, stackoverflow.com/questions/4012112/how-to-bring-the-selected-div-on-top-of-all-other-divs
function tofront(divid, toback)
{
    setindex = zindexmax++;
    toback = toback || false;

    var divs = ['addlog','calculate','addpoi','addstation','distance','editsystem','report','addbm','search_system'];

    if (toback == false)
    {
        if (document.getElementById(divid).style.display == "block")
        {
            document.getElementById(divid).style.display = "none";
            //document.getElementsByClassName('entries')[0].style.display = "block";
			$(".entries").fadeIn("fast");
        }
        else
        {
            //document.getElementById(divid).style.display = "block";
			$("#"+divid).fadeIn("fast");
            document.getElementById(divid).style.zindex = setindex;
            document.getElementsByClassName('entries')[0].style.display = "none";
        }
    }
    else
    {
        get_data(true);
        //document.getElementsByClassName('entries')[0].style.display = "block";
		$(".entries").fadeIn("fast");
    }
    var index;
    for (index = 0; index < divs.length; ++index)
    {
        if (document.getElementById(divs[index]) && divs[index] != divid)
        {
            document.getElementById(divs[index]).style.zindex = 0;
            document.getElementById(divs[index]).style.display = "none";
        }
    }
}

/*
* 	upload to imgur
*/

function imgurUpload(file)
{
	$('#uploaded').html("Uploading image...<br /><img src='/style/img/loading.gif' style='vertical-align:middle;' />");
	$.ajax({
		url: 'https://api.imgur.com/3/image',
		headers:
		{
			Authorization: 'Client-ID 36fede1dee010c0',
			Accept: 'application/json'
		},
		type: 'POST',
		data:
		{
			image: file,
			type: 'base64'
		},
		success: function(result)
		{
			var url = result.data.link;

			$('#uploaded').html("Image succesfully uploaded!<br /><a target='_BLANK' href='"+url+"'>Link to your image on imgur.com&nbsp;<img src='/style/img/external_link.png' style='vertical-align:middle;margin-bottom:3px;' alt='ext' /></a>");
			//console.log(result);
		},
	});
}

/*
*	set link divs as active
*/

function setActive(id, num)
{
	for (i = 0; i <= num; i++)
	{
		if (document.getElementById('link_'+i))
		{
			document.getElementById('link_'+i).className = "link";
		}
	}
	document.getElementById('link_'+id).className = "active";
}

/*
*	get wikipedia articles
*/

function get_wikipedia(search, id)
{
	if (document.getElementById("wpsearch_"+id).style.display == "none")
	{
		//$("#wpsearch_"+id).toggle();
		//document.getElementById("wpsearch_"+id).style.display = "block";
		$("#wpsearch_"+id).fadeIn();
		$("#wpsearch_"+id).html('<b>Querying Wikipedia</b><br /><img src="/style/img/loading.gif" alt="loading" />');

		$.ajax(
		{
			url: "/get/getWikipediaData.php?search="+search,
			cache: false,
			dataType: 'html',
			success: function(result)
			{
				var returnedvalue = result;

				$("#wpsearch_"+id).html(returnedvalue);
				//console.log(returnedvalue)
			}
		});
	}
	else
	{
		document.getElementById("wpsearch_"+id).style.display = "none";
	}
}

/*
*	update class and rating on nearest_systems.php
*/

function getCR(group_id)
{
	$.ajax({
	url: "/get/getRatingAndClass.php?group_id="+group_id,
	cache: false,
    dataType: 'json',
	success: function(result)
	{
		$('#rating').html(result['rating']);
		$('#class').html(result['class']);
	}
	});
}

/*
* 	http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
*/

function escapeRegExp(str)
{
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function replaceAll(str, find, replace)
{
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}