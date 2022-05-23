
var margin = { top: 50, right: 50, bottom: 50, left: 50 };


var lato = 700;
var limite = 640;   //Serve giusto per la linea separatrice
var width = lato - margin.left - margin.right;
var height = lato - margin.top - margin.bottom;                         

var xScaleStatico = d3.scaleLinear().range([0, width]);
var yScaleStatico = d3.scaleLinear().range([height, 0]);

var xScaleDinamico = d3.scaleLinear().range([0, width]);
var yScaleDinamico = d3.scaleLinear().range([height, 0]);

var cScale = d3.scaleOrdinal(d3.schemePastel2);

var xMin;
var yMin;

var eccesso;

var colorTime = 500;
var transictionTime = 850;

var svg = d3.select("body").append("svg")
    .attr("id", "svg_left")
    .attr("class", "firts_half")
    .attr("width", width + margin.top + margin.bottom )
    .attr("height", height + margin.top + margin.bottom )
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");  

    
    
var svg2 = d3.select("body").append("svg")
    .attr("id", "svg_right")
    .attr("class", "second_half")
    .attr("width", width + margin.top + margin.bottom )
    .attr("height", height + margin.top + margin.bottom )
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 


svg.append("rect")
    .attr("id", "middle")
    .attr("width", "1")
    .attr("height", lato)
    .attr("x", limite)
    .attr("y", "0")
    .style("stroke", "black")

svg.append("rect")
    .attr("id", "top")
    .attr("width", lato)
    .attr("height", "1")
    .attr("x", "0")
    .attr("y", "0")
    .style("stroke", "black")

svg2.append("rect")
    .attr("id", "top")
    .attr("width", lato)
    .attr("height", "1")
    .attr("x", "0")
    .attr("y", "0")
    .style("stroke", "black")


var temp = d3.select("body").append("div").attr("class", "temporanea").attr("id", "temp").attr("r","empty").attr("l","empty").attr("prev_id", "empty");


/*SOLO UO ALLA VLOTA, RICORDA DI CAMBIARE ALLA PRIMA CHIAMATA E ALL' UPDATE*/

function setScalerDinamico(data){
    xMax = d3.max(data, function(d){ return (d.posx + Math.max( (d.cesto/2) , d.pallone) )})    //d.posx + max tra mezzo lato e raggio;       e richiami l'updater ogni volta, quindi ti si scala tutto sil range che va da 0 a x(y) piu la dimensione del disegno OGNI VOLTA SU QUELLLO PIU IN LA
    yMax = d3.max(data, function(d){ return (d.posy + (d.pallone*2) + (d.pallone/2) )})      //d.posy + diametro piu mezzo raggio;

    cMin = d3.min(data, function(d){ return d.colore; })
    cMax = d3.max(data, function(d){ return d.colore; })

    coord_max = Math.max(xMax, yMax);

    xScaleDinamico.domain([0, coord_max]);
    yScaleDinamico.domain([0, coord_max]);
    cScale.domain([cMin, cMax]);

}


function setScalerStatico(data){

    cestoMax = d3.max(data, function(d){ return d.cesto;})
    raggioMax = d3.max(data, function(d){ return d.pallone;})
    eccesso = Math.max(cestoMax, raggioMax);

    xMax = d3.max(data, function(d){ return d.posx + eccesso; })
    yMax = d3.max(data, function(d){ return d.posy + raggioMax*2;})
    coord_max = Math.max(xMax, yMax);
    console.log(xMax, yMax, coord_max);

    cMin = d3.min(data, function(d){ return d.colore; })
    cMax = d3.max(data, function(d){ return d.colore; })

    xScaleStatico.domain([0, coord_max]);
    yScaleStatico.domain([0, coord_max]);
    cScale.domain([cMin, cMax]);


}


/*L'idea iniziale non era quella di modificare i dati e riavviare il disegno ma di 
salvare i valori da scambiare delle monngolfiere e poi riavviare il disegno solo di quelle.
Il problema è fare in modo che gli scaler e le get ai campi vadano a buon fine e non mi veniva dunque ho cambiato approccio*/



function updateDraws(data){
 
                             //non c'è bisogno poichè gli scaler sono settati in modod da non far uscire mai le immagini altrimenti poi non si capiscono piu le dimensioni
    setScalerDinamico(data);
    Mongolfiere(data);
    
}

/**
 * Mi legge i dati dal json e me li salva, poi li scorre e ci costruisce le mongolfiere
 * (PER ORA NIENTE MONGOLFIERE, FACCIO CON QUADRATI E POI AGGIUTO LA CREAZIONE)
 * @param {*} data TUTTI i dati del json  
 */
function Mongolfiere(data){


    var mongolfiera = svg.selectAll(".path")
        .data(data);

    /*exit*/
    mongolfiera.exit().remove();

    /*selezione fuori dal dom*/
    mongolfiera.enter().append("path")
        .attr("class", "path")
        .attr("id", function(d) { return data.indexOf(d)})
        .attr("x", function(d) { return Math.abs( xScaleStatico(d.posx) ); })
        .attr("y", function(d) { return Math.abs( yScaleStatico(d.posy)) ; })
        .attr("colore", function(d){ return cScale(d.colore); })
        .attr("d", function(d) { 
            return mongolfieraPath( xScaleStatico(d.posx), yScaleStatico(d.posy), xScaleStatico(d.cesto), xScaleStatico(d.pallone) ); 
            })
        .style("fill", function(d){ return cScale(d.colore); })
        .style("stroke", "black")
        .on("click", function(d){            //SE passassassi data nei parametri avrei solo il record corrente, ma io devo interagire anche con i dati relativi all'item del click precedente

            
            /**
             * strategia: al primo click voglio segnarmi i valori della mongolfiera in un oggetto temporaneo
             * (li perdo in esecuzioni differenti? mi creo un item apposta così taglio la testa al toro).
             * NOTA: se avessi operazioni piu complesse questo mi rallenta la pagina!! <-- potrei usare variabili ma così mi alleno con l'uso di elementi web
             * Al secondo click metto i valori correnti nel primo item e quelli temporanei nell'oggetto corrente
             */
            var temp_item = d3.select("#temp");

            if (temp_item.attr("r") == "empty" && temp_item.attr("l") == "empty" && temp_item.attr("prev_id")== "empty" ){

                var current = d3.select(this);
                current.transition().duration(colorTime).style("fill", "white");  //seleziono l'elemento e cambio subito colore

                current_id = current.attr("id");                                        //mmi segno l'id per l'operazione del prossimo click  

                temp_item.attr("r", function(d) { return data[current_id].pallone; } ); //salvo i valori dell'item nel temporaneo per fare lo scambio dopo
                temp_item.attr("l", function(d) { return data[current_id].cesto;   } );
                temp_item.attr("prev_id", current_id );
                
            }
            else{                 
                var current = d3.select(this);                          //seleziono l'elemento corrente
                current_id = current.attr("id");
                prev_id = temp_item.attr("prev_id");                    //e ritiro fuori l'id dell'elemento precedente
                
                data[prev_id].cesto = data[current_id].cesto;           //dati del corrente nel precedente
                data[prev_id].pallone = data[current_id].pallone;

                data[current_id].cesto = temp_item.attr("l");           //dati del precedente(dal temp) nel corrente
                data[current_id].pallone = temp_item.attr("r");

                temp_item.attr("r", "empty");                           //reset del temp per perettere di rifare l'azione
                temp_item.attr("l", "empty" );
                temp_item.attr("prev_id", "empty" );

                updateDraws(data);                                      //ed infine redisegno tutto
            }

        });
    
    /*update di elementi nel dom*/
    mongolfiera.transition().duration(transictionTime)
        .attr("x", function(d) { return xScaleStatico(d.posx); })
        .attr("y", function(d) { return yScaleStatico(d.posy); })
        .attr("d", function(d) { 
            return mongolfieraPath( xScaleStatico(d.posx), yScaleStatico(d.posy), xScaleStatico(d.cesto), xScaleStatico(d.pallone) )
            })
        .style("fill", function(d){ return cScale(d.colore); })
        .style("stroke", "black");

        
        
        /*ORA TUTTO DACCAPO PER IL SECONDO SVG   ========================================================*/

    
    
    var mongolfiera2 = svg2.selectAll(".path")
        .data(data);

    /*exit*/
    mongolfiera2.exit().remove();

    /*selezione fuori dal dom*/
    mongolfiera2.enter().append("path")
        .attr("class", "path")
        .attr("id", function(d) { return data.indexOf(d)})
        .attr("x", function(d) { return Math.abs( xScaleDinamico(d.posx) ); })
        .attr("y", function(d) { return Math.abs( yScaleDinamico(d.posy)) ; })
        .attr("colore", function(d){ return cScale(d.colore); })
        .attr("d", function(d) { 
            return mongolfieraPath( xScaleDinamico(d.posx), yScaleDinamico(d.posy), xScaleDinamico(d.cesto), xScaleDinamico(d.pallone) ); 
            })
        .style("fill", function(d){ return cScale(d.colore); })
        .style("stroke", "black")
        .on("click", function(d){           
            
    
            var temp_item = d3.select("#temp");

            if (temp_item.attr("r") == "empty" && temp_item.attr("l") == "empty" && temp_item.attr("prev_id")== "empty" ){

                var current = d3.select(this);
                current.transition().duration(colorTime).style("fill", "white"); 

                current_id = current.attr("id");                               

                temp_item.attr("r", function(d) { return data[current_id].pallone; } ); 
                temp_item.attr("l", function(d) { return data[current_id].cesto;   } );
                temp_item.attr("prev_id", current_id );
                
            }
            else{                 
                var current = d3.select(this);                          //seleziono l'elemento corrente
                current_id = current.attr("id");
                prev_id = temp_item.attr("prev_id");                    //e ritiro fuori l'id dell'elemento precedente
                
                data[prev_id].cesto = data[current_id].cesto;           //dati del corrente nel precedente
                data[prev_id].pallone = data[current_id].pallone;

                data[current_id].cesto = temp_item.attr("l");           //dati del precedente(dal temp) nel corrente
                data[current_id].pallone = temp_item.attr("r");

                temp_item.attr("r", "empty");                           //reset del temp per perettere di rifare l'azione
                temp_item.attr("l", "empty" );
                temp_item.attr("prev_id", "empty" );

                updateDraws(data);                                      //ed infine redisegno tutto
            }

        });
    
    /*update di elementi già nel dom*/
    mongolfiera2.transition().duration(transictionTime)
        .attr("x", function(d) { return xScaleDinamico(d.posx); })
        .attr("y", function(d) { return yScaleDinamico(d.posy); })
        .attr("d", function(d) { 
            return mongolfieraPath( xScaleDinamico(d.posx), yScaleDinamico(d.posy), xScaleDinamico(d.cesto), xScaleDinamico(d.pallone) )
            })
        .style("fill", function(d){ return cScale(d.colore); })
        .style("stroke", "black");

        
}



/**
 * funzione per scrivere il disegno parametrizzato dai dati
 * @param {*} x la coordinata x del disegno
 * @param {*} y la coordinata y del disegno (il disegno è centrato tra il pallone ed il cesto)
 * @param {*} cesto grandezza del lato che forma il cesto
 * @param {*} pallone  grandezza del raggio che forma il pallone
 * @returns la stringa path per una mongolfiera
 */
function mongolfieraPath(x, y, cesto, pallone){
    let mezzo = pallone / 2;
    let quarto = pallone/4;
    let latomezzo = cesto/2;
    return 'M '+ x + ' ' + y + ' L ' + (x+quarto) +' '+ (y-mezzo) + ' A ' + pallone + ' ' + pallone + ', 0, 1, 0, ' + (x - quarto) + ' ' + (y-mezzo) + ' L ' + x + ' '+ y + ' L ' + (x-latomezzo) + ' '+ y + 'L' + (x-latomezzo) + ' '+ (y+cesto) + ' L ' + (x+latomezzo) + ' '+ (y+cesto) + ' L ' + (x+latomezzo) + ' '+ y + ' Z';
}

/**
 * funzione principale, legge i dati e chiama le funzioni per la visualizzazione.
 * Se qualcosa va storto stampa ll'errore nella console
 */
d3.json("data/data.json")
    .then(function(data) {
        console.log("data: ");
        console.log(data);

        setScalerStatico(data);
        setScalerDinamico(data);
        Mongolfiere(data);



    }).catch(function(error){
        console.log(error)
    });
