"use strict";

// Se esta em modo de edicao da <area>, caso false criara nova
var editing = false;

$("[type=file]").on("change", function(){
	$("#image").attr("src", "");
});

$("#editing_mode").on("click", function(){
	editing = !editing;
	$("#editing_mode").toggleClass("editing");
});

// Evento ao selecionar nova imagem
// (alterar o <input> do tipo 'file')
$("#file").on("change", function(e){
	onUpload(e, function(ev){
		$("#image").attr("src", ev.target.result);
	});
});

// Evento ao clicar sobre a <img> (na <div> sobre ela)
// (edicao de uma area ja inicializada ou inicio de uma)
$("#image").parent().on("click", newCoord);

// Controla o cursor sobre a <img> para indicar a edicao
$("#image").parent().on("mousemove",function(){
	if(editing){
		$(this).css("cursor", "url(img/cursor.png), auto");
	} else {
		$(this).css("cursor", "default");
	}
});

// Atalhos para o documento
$(document).keydown(function(e){
	// Cancela a edicao de uma area (ESC)
	if(e.which === 27){
		editing = false;
		$("#editing_mode").toggleClass("editing");
	}
	// Desfaz ultimo ponto criado (CTRL+Z)
	if(e.which === 90 && e.ctrlKey){
		removeLastCoord();
		updateHighlight();
	}          
});

// Botao para baixar HTML
$("#download").on("click", function(){
	var doc   = $("#template").val();
	var areas = $("#areas").children();

	// Coleta as <area> criadas
	var doc_areas = "";
	for (var i=0; i<areas.length; i++){
		doc_areas += "\t\t"+areas[i].outerHTML+"\n";
	}

	// Adiciona a imagem e tags <area> no template
	doc = doc
		.replace("$base64", $("#image").attr("src"))
		.replace("$areas", doc_areas);

	// Faz o download do arquivo
	var blob = new Blob([doc], {type: "text/html;charset=utf-8"});
	saveAs(blob, "index.html");
});

// Botao carregar arquivo HTML
$("#load_file").on("click", function(){
	$("#load").trigger("click");
});

// Botao carregar nova imagem
$("#new_img").on("click", function(){
	$("#file").trigger("click");
});

// Evento ao carregar arquivo HTML
// (alterar o <input> do tipo 'file')
$("#load").on("change", function(e){
	onUpload(e, function(ev){
		
		// Documento HTML
		var html = $.parseHTML(atob(
			ev.target.result.replace(/.*base64\,/, "")
		));

		// Coleta a imagem e as areas
		for (var i in html) {
			if (html[i].nodeName === "IMG"){
				var img = html[i];
			}
			if (html[i].nodeName === "MAP"){
				var areas = $(html[i]).children();
			}
		}

		// Seta a imagem
		$("#image").attr("src", img.src);

		// Percorre e adiciona as areas
		for (var i=0; i<areas.length; i++){
			$("#areas").append(areas[i]);
			$(areas[i]).on("contextmenu", removeArea);
		}
	});
});

/**
 * Adiciona o highlight nas <area> do <map>
 * 
 * @returns {undefined}
 */
function updateHighlight(){
	$("#image").maphilight({
		fill        : true,
		fillColor   : "0000FF",
		fillOpacity : 0.2,
		strokeColor : "0000FF",
		alwaysOn    : true
	});
}

function onUpload(e, fn){
	// Visualiza a <img>
	$("#image").show();
	// Limpa areas criadas dentro do <map>
	$("#areas").html("");
	// Carrega o base64 na <img>
    var reader = new FileReader();
    reader.onload = function(event){
		fn(event);
    };
    reader.readAsDataURL(e.target.files[0]);
	updateHighlight();
}

/**
 * Cria uma nova <area> dentro do elemento <map>
 * 
 * @param {integer} x Coordenada inicial X
 * @param {integer} y Coordenada inicial Y
 * @returns {undefined}
 */
function createArea(x ,y){
	// Cria uma <area> com atributos iniciais
	var map = $("<area>").attr({
		"shape"  : "poly",
		"coords" : x+","+y
	});

	// Nova coordenada caso clicado sobre a <area>
	$(map).click(newCoord);

	// Opcao para remover <area>
	$(map).on("contextmenu", removeArea);

	// Adiciona a <area> no <map>
	$("#areas").append(map);
}

/**
 * Cria uma nova coordenada sobre o evento recebido
 * 
 * @param {object} e Evento
 * @returns {undefined}
 */
function newCoord(e){
	var event = e || window.event;
	
	// Se foi clicado inicialmente e selecionou a tag <center>
	if($(e.target).is("center")){
		updateHighlight();
		return;
	}

	// Coleta coordenadas do clique
	var offset = $("#image").offset();
	var x = parseInt(event.pageX-offset.left);
	var y = parseInt(event.pageY-offset.top);

	// Se criara uma nova <area>
	if (!editing){
		$("#editing_mode").toggleClass("editing");
		editing = !editing;
		// Cria nova <area>
		createArea(x, y);
		// Declara que esta em modo de edicao
		return;
	}

	// Adiciona as novas coordenadas na ultima <area> criada
	var lastCoord = $($("area")[$("area").length-1]).attr("coords");
	$($("area")[$("area").length-1]).attr("coords", lastCoord+", "+x+","+y);

	updateHighlight();
}

/**
 * Remove ultima coordenada da <area> que esta sendo editada
 * 
 * @returns {undefined}
 */
function removeLastCoord(){
	// Confere se exite areas
	if ($("area").length < 1){
		return;
	}
	// Coleta as coordenadas
	var lastCoord = $($("area")[$("area").length-1]).attr("coords");
	// Verifica o tipo de remocao
	if(lastCoord.match(/\s/g)){ // Remove ultima coordenada
		$($("area")[$("area").length-1])
			.attr("coords", lastCoord.replace(/,.[^\s]*$/, ""));
	} else { // Remove html da ultima <area>
		$($("area")[$("area").length-1]).remove();
	}
}

/**
 * Remove uma <area> se confirmada exclusao
 * 
 * @param {object} e
 * @returns {undefined}
 */
function removeArea(e){
	// Previne eventos
	e.preventDefault();
	// Se confirmado, exclui a <area>
	if(window.confirm("Realmente deseja excluir esta marcação?")){
		$(e.target).remove();
		updateHighlight();
		editing = false;
	}
}