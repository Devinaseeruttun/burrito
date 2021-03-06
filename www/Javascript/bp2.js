(function(){
	var bP={};	
	var b=20, bb=150, height=0, buffMargin=1, minHeight=14;
	var c1=[-15, 15]; //, c2=[-50, 100], c3=[-10, 60]; //Column positions of labels.
	var colors = d3.scale.category20().range();
	var single_line_height_factor = 1;
	
	bP.partData = function(data, displayed_taxa, displayed_funcs){
		var sData={};
		var cat1 = d3.keys(data[0])[0], cat2 = d3.keys(data[0])[1], num3 = d3.keys(data[0])[2];
		sData.keys=[displayed_taxa, displayed_funcs];
		
		sData.data = [	sData.keys[0].map( function(d){ return sData.keys[1].map( function(v){ return 0; }); }),
						sData.keys[1].map( function(d){ return sData.keys[0].map( function(v){ return 0; }); }) 
		];

		data.forEach(function(d){ 
			sData.data[0][sData.keys[0].indexOf(d[cat1])][sData.keys[1].indexOf(d[cat2])]=1*d[num3];
			sData.data[1][sData.keys[1].indexOf(d[cat2])][sData.keys[0].indexOf(d[cat1])]=1*d[num3]; 
		});
				
		return sData;
	}
		function visualize(data){
		var vis ={};
		function calculatePosition(a, s, e, b, m){

			var total=a.length;

			var sum=0, neededHeight=0, leftoverHeight= e-s-2*b*a.length;
			var ret =[];
			
			a.forEach(
				function(d){ 
					var v={};
					v.percent = d; //(total == 0 ? 0 : d/total); //d is 1 or 0 only
					v.value=d;
					v.height=1; //Math.max(v.percent*(e-s-2*b*a.length), m); 
					(v.height==m ? leftoverHeight-=m : neededHeight+=v.height );
					ret.push(v);
				}
			);
			var scaleFact=leftoverHeight/Math.max(neededHeight,1), sum=0;
			ret.forEach(
				function(d, i){ 
					d.key = i;
					d.percent = scaleFact*d.percent; 
					d.height= scaleFact; //*d.value; //(d.height==m? m : d.height*scaleFact);
					d.middle=sum+b+d.height/2;
					d.y=s + d.middle; //- d.percent*(e-s-2*b*a.length)/2;
					d.h= 2; //scaleFact; //d.value; //d.percent*(e-s-2*b*a.length);
					d.percent = (total == 0 ? 0 : d.value/total);
					sum+=2*b+d.height;
					d.wid=d.value;
				}
			);
			return ret;
		}

		//making the main 2 bars
		vis.mainBars = [ 
			calculatePosition( data.data[0].map(function(d){ return d.length;}), 0, height, buffMargin, minHeight), //d3.sum(d) 
			calculatePosition( data.data[1].map(function(d){ return d.length;}), 0, height, buffMargin, minHeight)
		];
		
		//making the bars for each node
		vis.subBars = [[],[]];
		vis.mainBars.forEach(function(pos,p){
			pos.forEach(function(bar, i){	
				if(bar.value !== 0){
					calculatePosition(data.data[p][i], bar.y, bar.y, 0, 0).forEach(function(sBar,j){ //+bar.h
						sBar.key1=(p==0 ? i : j); 
						sBar.key2=(p==0 ? j : i); 
						vis.subBars[p].push(sBar); 
					});
				}
			});
		});
		vis.subBars.forEach(function(sBar){
			sBar.sort(function(a,b){ 
				return (a.key1 < b.key1 ? -1 : a.key1 > b.key1 ? 
						1 : a.key2 < b.key2 ? -1 : a.key2 > b.key2 ? 1: 0 )});
		});
		vis.edges = vis.subBars[0].map(function(p,i){

			return {
				key1: p.key1,
				key2: p.key2,
				y1:p.y,
				y2:vis.subBars[1][i].y,
				h1:p.h,
				h2:vis.subBars[1][i].h,
				val:p.value,
				wid:p.value
			};
		});
		vis.edges = vis.edges.filter(function(d){ return d.val!==0});
		vis.keys=data.keys;
		return vis;
	}
	
	function arcTween(a) {
		var i = d3.interpolate(this._current, a);
		this._current = i(0);
		return function(t) {
			return bP.edgePolygon(i(t));
		};
	}
	
	function drawPart(data, id, p, colors){
		d3.select("#"+id).append("g")
			.attr("class","part"+p)
			.attr("id","part"+p)
			//.attr("font-family","Verdana") //for legend to save with correct fonts
			.attr("transform","translate("+ (p==0 ? (-1*(bb+b)) : (bb)) +",0)");

		d3.selectAll("#bpNodetooltip0").remove();
		d3.selectAll("#bpNodetooltip1").remove();

		var padding = 0;
		var nbar = data.mainBars[p].length;
		if ( nbar < 5) { padding = 20;
		}else if (nbar < 11) {padding = 10;
		}else if (nbar < 25) {padding = 5;
		}else { nbar = 4;}
		
		saveLegBar = d3.select("#"+id).select(".part"+p).append("svg")
			.attr("id","saveLegBar"+p)			
			.attr("x", p == 0 ? -(extra_width - b - bb) : 0)
			.attr("width", p == 0 ? (extra_width - bb) : (extra_width - bb)) //function legend is larger because longer names
			.attr("height", height)
			//.attr("font-family","Verdana");


		//d3.select("#"+id).select(".part"+p).append("g").attr("class","subbars");
		d3.select("#"+id).select(".part"+p).select("#saveLegBar"+p).append("g")
			.attr("class","mainbars");
		//
		
		var mainbar = d3.select("#"+id).select(".part"+p).select("#saveLegBar"+p).select(".mainbars")
			.selectAll(".mainbar").data(data.mainBars[p])
			.enter().append("g").attr("class","mainbar");

		mainbar.append("text").attr("class","barlabel")
			.attr("x", p == 0 ? c1[p] + (extra_width-b-bb) : c1[p])
			.attr("y",function(d){ return d.middle;})
			.style("font-size", bipartite_graph_label_size)
			.attr("text-anchor", p == 0 ? "end" : "start" )
			.attr("alignment-baseline","middle")
			.attr("dominant-baseline", "middle")
			.text(function(d,i){
				name_split = (data.keys[p][i].split('_')).pop()
				return name_split;
				//return data.keys[p][i];
				});
		//		.transition().duration(300);
	
		mainbar.append("rect")
			.attr("x", 0)
			.attr("y",function(d){ return (d.middle-d.height/2 + (padding/2)); })
			.attr("width",extra_width - bb)
			.attr("height",function(d){
				return (d.height - padding); })
			.style("fill-opacity",0).style("stroke-opacity",0)

		mainbar.append("rect").attr("class","mainrect")
			.attr("x", p == 0 ? (extra_width -bb - b) : 0)//0)
			.attr("y",function(d){ return (d.middle-d.height/2 + (padding/2)); })
			.attr("width",b)
			.attr("height",function(d){
				return (d.height - padding); })
			.style("shape-rendering","auto")
			.style("fill", function(d) {return colors(data.keys[p][d["key"]])} )
			.style("stroke-width","0.5")
			.style("stroke","black").style("stroke-opacity",0)
			.transition().duration(300);

		if(data.keys[p].length==1){
			fontSize=24;	
		}  else{
			fontSize = 24/Math.log(data.keys[p].length) + 2;
		}
		mainbar.selectAll(".barlabel").style("font-size", fontSize+"px");
 		
		// Split labels into multiline labels and/or shrink font size so they fit
		mainbar.selectAll("text").each( function(d,i) {
			var this_text_object = d3.select(this)
			var this_text = this_text_object.text();
			var this_bbox = this_text_object[0][0].getBBox();
			var single_line_height = this_bbox.height * single_line_height_factor;
			var curr_font_size = this_text_object.style("font-size");
			var font_size_value = curr_font_size.substring(0, curr_font_size.length - 2);


			var check_value = null;
			if (p == 0){

			}
			while ((Math.abs(c1[p]) + this_bbox.width) > (extra_width - bb - b) & font_size_value - font_scaling_step_size > minimum_font_size){
				//console.log(this_bbox.width)
				// Find the first space in the text to try and line break there
				var first_space_index = this_text.indexOf(' ');

				// If there is a space, create a line break there
				if (first_space_index >= 0){
					this_text = this_text.substring(0, first_space_index) + "\n" + this_text.substring((first_space_index + 1), this_text.length);

				// Otherwise, decrease the font size to try to make it fit
				} else {
					curr_font_size = this_text_object.style("font-size");
					font_size_value = curr_font_size.substring(0, curr_font_size.length - 2);
					this_text_object.style("font-size", (font_size_value - font_scaling_step_size) + "px");
				}

				// Find all line breaks in the new text
				var line_break_indices = [];
				for (var curr_index = 0; curr_index < this_text.length; curr_index++){
					if (this_text[curr_index] == "\n"){
						line_break_indices.push(curr_index);
					}
				}
				
				var curr_line_break_index = 0;

				// Create line breaks in the text object
				this_text_object.text(this_text.substring(0, line_break_indices[curr_line_break_index]));
				this_text_object.attr("y", d.middle - (single_line_height * line_break_indices.length / 2))
				for (; curr_line_break_index < line_break_indices.length; curr_line_break_index++){

					// If we're looking at the last word, add the text up to the end
					if (curr_line_break_index == line_break_indices.length - 1){
						this_text_object.append("tspan")
							.attr("x", this_text_object.attr("x"))
							.attr("dy", single_line_height)
							.text(this_text.substring((line_break_indices[curr_line_break_index] + 1), this_text.length))

					// Otherwise, we're looking at a word in the middle, so we add up to the next line break
					} else {
						this_text_object.append("tspan")
							.attr("x", this_text_object.attr("x"))
							.attr("dy", single_line_height)
							.text(this_text.substring((line_break_indices[curr_line_break_index] + 1), line_break_indices[curr_line_break_index + 1]))
					}
				}

				this_bbox = this_text_object[0][0].getBBox();
			}
		});
	}


	// function updatePart(data, id, p){
	// 	d3.select("#"+id).select(".part"+p).select(".mainbars").selectAll(".mainbar")
	// 		.data(data.mainBars[p]).transition();

	// 	d3.select("#"+id).select(".part"+p).select(".subbars").selectAll(".subbar")
	// 		.data(data.subBars[p]).transition();

	// }

	function generate_bipartite_graph_tooltip(tax, func, width, totalShare){
		tax_split = tax.split('_').pop()
		func_split = func.split('_').pop()
		return bipartite_graph_tooltip_text[0] + tax_split + bipartite_graph_tooltip_text[1] + func_split +  bipartite_graph_tooltip_text[2] + Math.round(width*100)/100 + bipartite_graph_tooltip_text[3] + bipartite_graph_tooltip_text[4] + Math.round(totalShare*100)/100 + bipartite_graph_tooltip_text[5];
	}

	function generate_bipartite_node_tooltip(p, id, value){
		id_split = id.split('_').pop()
		p == 0 ? category = bipartite_node_tooltip_text[0] : category = bipartite_node_tooltip_text[1]
		return category + id_split + bipartite_node_tooltip_text[2] + Math.round(value*100)/100 + bipartite_node_tooltip_text[3]; // + bipartite_node_tooltip_text[2] + Math.round(totalShare*100)/100 + bipartite_node_tooltip_text[3];
	}
	
	function drawEdges(data, id, taxa_colors, func_colors, displayed_taxa, displayed_funcs, highlightall, dehighlightall, avg_contrib_data){
		d3.select("#"+id).append("g").attr("class","edges").transition().duration(300).attr("transform","translate(0,0)");

		edgeBar = d3.select("#"+id).select(".edges").selectAll(".edge")
			.data(data.edges).enter().append("polygon")
			.attr("class","edge")
			.attr("points", bP.edgePolygon2)
			.classed("highlighted", false);
			
		d3.selectAll("#bptooltipdiv").remove();

		var tooltip = d3.select("body")
  			.append("div")
			.attr("id","bptooltipdiv")
  			.style("position", "absolute")
  			.style("z-index", "10")
  			.style("visibility", "hidden")
  			.style("background", "lightyellow")
  			.style("opacity", "1")
  			.style("border", "1px")    
  			.style("border-radius", "4px")  
  			.style("padding","2px")
			.text(default_bipartite_graph_tooltip_text);



		edgeBar.style("fill", "white") //function(d){ return taxa_colors(data.keys[0][d.key1]) ;})
			.style("opacity",0).each(function(d) { this._current = d; })
// 			.attr("width", function(d){
// 					return d.wid;
// 				})
//this does not control the width! Edgepolygon2 does!
			.on("mouseover", function(d,i){ 
					d3.select(this).attr("points", bP.edgePolygon2).style("opacity",1);
					clickedEdges = d3.select("#Genomes").select(".edges").selectAll(".clicked")
					if(clickedEdges.empty()||d3.select(this).classed("clicked")==true){
						tooltip.html(generate_bipartite_graph_tooltip(displayed_taxa[d.key1], displayed_funcs[d.key2], d.wid, d.shareOfTotal))
						tooltip.style("visibility", "visible")
					}
			})
			.on("mousemove", function(d){
				return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+15)+"px");
			})
			.on("mouseout", function(d,i){ 
				current_data = this._current
					d3.select(this).attr("points", bP.edgePolygon2)
						.style("opacity",function(e){
							if(d3.select(this).classed("clicked")){
								return 1;
							} else if(d3.select("#Genomes0"+displayed_taxa[current_data.key1].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")).classed("clicked")==false && d3.select("#Genomes1"+displayed_funcs[current_data.key2].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")).classed("clicked") == false){ //if associated taxon is not clicked
								return 0;
							} else if(d3.select("#Genomes").select(".edges").selectAll(".clicked").empty() == false){ //if another edge is clicked
								return 0.2;
							} else{
								return 0.65;
							}
							});//.style("fill", "grey");
				tooltip.style("visibility", "hidden")
			})
			.on("click", function(d,i){
				current_data = this._current
				tooltip.html(generate_bipartite_graph_tooltip(displayed_taxa[d.key1], displayed_funcs[d.key2], d.wid, d.shareOfTotal))
				tooltip.style("visibility","visible")
				if(d3.select(this).classed("highlighted")==false){
				//unselect other edges
				} 
				if(d3.select(this).classed("clicked")==true){ //edge already clicked
					d3.select(this).style("opacity", 0.65)
					d3.select(this).classed("clicked", false)
					dehighlightall(displayed_taxa[current_data.key1], displayed_funcs[current_data.key2], 3, bars_only = false)
					//Revert to original highlighting
					if(d3.select("#Genomes0"+displayed_taxa[current_data.key1].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")).classed("clicked")==true){
						//dehighlight other end
						d3.select("#Genomes1"+displayed_funcs[current_data.key2].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")).classed("highlighted", false)
						bP.deSelectSegment(1, current_data.key2, taxa_colors, func_colors, displayed_taxa, displayed_funcs)
						highlightall(displayed_taxa[current_data.key1], "", 1)
					} else {
						d3.select("#Genomes0"+displayed_taxa[current_data.key1].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")).classed("highlighted", false)
						bP.deSelectSegment(0, current_data.key1, taxa_colors, func_colors, displayed_taxa, displayed_funcs)
						highlightall("", displayed_funcs[current_data.key2], 2)
					}
					
				}else{ //if this edge is not already clicked
					d3.select(this).style("opacity",1)
// 					tooltip.style("visibility", "visible")
															//dehighlight other taxa
					displayed_taxa.map(function(e,j){
						if(j != current_data.key1){ //if this should not be highlighted
							if(d3.select("#Genomes").select(".edges").selectAll(".clicked").filter(function(f){return (f["key1"]==j); }).empty()==false){ //if an edge is clicked that includes this taxon
								dehighlightall(e, displayed_funcs[current_data.key2], 3, bars_only = false)
							}  else {
								dehighlightall(e, displayed_funcs[current_data.key2], 3, bars_only = true)
							} 
							d3.select("#Genomes0"+e.replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_"))
								.classed("highlighted",false)
								.classed("clicked",false);
								
							bP.deSelectSegment(0, j, taxa_colors, func_colors, displayed_taxa, displayed_funcs)
							
							d3.select("#Genomes").select(".edges").selectAll(".edge")
								.filter(function(f){ 
									return (f["key1"]==j); })
								.classed("clicked", false)
								.style("opacity",0.2);

						} else{
						}
					})

					displayed_funcs.map(function(e,j){
						if(j != current_data.key2){
							if(d3.select("#Genomes").select(".edges").selectAll(".clicked").filter(function(f){return (f["key2"]==j); }).empty()==false){
								dehighlightall(displayed_taxa[current_data.key1], e, 3, bars_only = false)
							} else {
								dehighlightall(displayed_taxa[current_data.key1], e, 3, bars_only = true)
							}
							d3.select("#Genomes1"+e.replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")).classed("highlighted",false)
							d3.select("#Genomes1"+e.replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")).classed("clicked",false)
							bP.deSelectSegment(1, j, taxa_colors, func_colors, displayed_taxa, displayed_funcs)
							
							d3.select("#Genomes").select(".edges").selectAll(".edge")
								.filter(function(f){ 
									return (f["key2"]==j); })
								.classed("clicked", false)
								.style("opacity",0.2);
							//dehighlightall(displayed_taxa[current_data.key1], e, 3, bars_only = false)
							}else{
						}
					})

					
				
					if(d3.select("#Genomes0"+displayed_taxa[current_data.key1].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")).classed("clicked")==false){ //if function is clicked already but not taxon
	// 					displayed_taxa.map(function(e,j){ //dehighlight all other funcs
	// 						if(j != current_data.key1){
	// 							dehighlightall(e, "", 1)
	// 						}
	// 					})
						// dehighlight functions then rehighlight since we are switching from relative abundance highlighting to contribution highlighting
						dehighlightall('', displayed_funcs[current_data.key2], 2)

						d3.select("#Genomes0"+displayed_taxa[current_data.key1].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")).classed("highlighted", true)
						
						bP.selectSegment(0, current_data.key1, taxa_colors, func_colors, displayed_taxa, displayed_funcs, no_edges = true)
						//make bold etc
					} else{ //if taxon is clicked but not function
	// 					displayed_funcs.map(function(e,j){ //dehighlight all other funcs
	// 						if(j != current_data.key2){
	// 							dehighlightall("", e, 2)
	// 						}
	// 					})
						d3.select("#Genomes1"+displayed_funcs[current_data.key2].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")).classed("highlighted", true)
						bP.selectSegment(1, current_data.key2, taxa_colors, func_colors, displayed_taxa, displayed_funcs, no_edges = true)
					}
					highlightall(displayed_taxa[current_data.key1], displayed_funcs[current_data.key2],3)
					d3.select(this).classed("clicked",true)
				}
			})
			.transition().duration(300)
			.attr("visibility","hidden")
			.style("opacity",0); //for saving which weirdly misses hidden-ness
			//brush would go here
	}	
	

	function drawHeader(header, id){
		//d3.select("#"+id).append("g").attr("class","header").append("text").text(header[2])
		//	.style("font-size","20").attr("x",108).attr("y",-20).style("text-anchor","middle")
		//	.style("font-weight","bold");
		
		[0,1].forEach(function(d){
			var h = d3.select("#"+id).select(".part"+d).append("g").attr("class","header");
			
			h.append("text").text(header[d]).attr("x", (c1[d]-3))
				.attr("y", -5).style("fill","black").style("font-size", "14pt");
			//h.append("text").text("Count").attr("x", (c2[d]-10))
			//	.attr("y", -5).style("fill","grey");
			// h.append("line").attr("x1",c1[d]-10).attr("y1", -2)
			// 	.attr("x2",c3[d]+10).attr("y2", -2).style("stroke","black")
			// 	.style("stroke-width","1").style("shape-rendering","crispEdges");
		});
	}
	
	bP.edgePolygon = function(d){
		return [-bb, d.y1, bb, d.y2, bb, d.y2+d.h2, -bb, d.y1+d.h1].join(" ");
	}	

	bP.edgePolygon2 = function(d){
		if(d.wid < 2){ //don't change
			return [-bb, d.y1-Math.sqrt(2), bb, d.y2-Math.sqrt(2), bb, d.y2+Math.sqrt(2), -bb, d.y1+Math.sqrt(2)].join(" ");
		} else{
			return [-bb, d.y1-Math.sqrt(d.wid), bb, d.y2-Math.sqrt(d.wid), bb, d.y2+Math.sqrt(d.wid), -bb, d.y1+Math.sqrt(d.wid)].join(" ");
			//return [-bb, d.y1-d.wid/5, bb, d.y2-d.wid/5, bb, d.y2+d.wid/5, -bb, d.y1+d.wid/5].join(" ");

	}
		//
	}	
	
	bP.draw = function(bip, svg, dims, taxa_colors, func_colors, displayed_taxa, displayed_funcs, highlightall, dehighlightall, avg_contrib_data, clickResponse, avg_perc_funcs){

		bb = dims.width * .075;
		b = dims.width / 50;
		c1 = [-(5 + 0.005*dims.width), b + (5 + 0.005*dims.width)];
		extra_width = (dims.width /2) - dims.treewidth;
		//add parameters here once I figure out ideal
		
		height = dims.height - dims.header;

		bP.updateGraph(bip, svg, dims, taxa_colors, func_colors, displayed_taxa, displayed_funcs, highlightall, dehighlightall, avg_contrib_data, clickResponse, avg_perc_funcs) //bip id has to be the same


	}
		

	bP.updateGraph = function(bip, svg, dims, taxa_colors, func_colors, displayed_taxa, displayed_funcs, highlightall, dehighlightall, avg_contrib_data, clickResponse, avg_perc_funcs){ //bip id has to be the same

		//svg.select("#"+bip.id).transition();
		svg.select("#"+bip.id).remove(); //.transition();
		svg.append("g")
			.attr("id", bip.id);
			

		var visData = visualize(bip.data);
		
		//calculate edge widths corresponding with average contribution to function, also include average attribution of ttotal
// 		console.log(avg_perc_funcs)
		visData["edges"] = visData.edges.map(function(d){
// 				console.log(avg_contrib_data[displayed_taxa[d.key1]][displayed_funcs[d.key2]])
				sub_contrib = avg_contrib_data[displayed_taxa[d.key1]][displayed_funcs[d.key2]]
				avg_share = avg_perc_funcs[displayed_funcs[d.key2]][displayed_taxa[d.key1]]
			//divided by all the things with that function
// 				all_func = d3.keys(avg_contrib_data).map(function(e){ 
// 					return avg_contrib_data[e][displayed_funcs[d.key2]]; })
// 				console.log(d3.sum(all_func))
			return {h1: d.h1, h2: d.h2, key1: d.key1, key2: d.key2, val: d.val, wid: avg_share, y1: d.y1, y2:d.y2, shareOfTotal: 100*sub_contrib };
			})

		drawPart(visData, bip.id, 0, taxa_colors);
		drawPart(visData, bip.id, 1, func_colors); 
		drawEdges(visData, bip.id, taxa_colors, func_colors, displayed_taxa, displayed_funcs, highlightall, dehighlightall, avg_contrib_data);
	
		//add tooltips
		var taxaTooltip = d3.select("body")
  			.append("div")
			.attr("id","bpnodetooltip0")
  			.style("position", "absolute")
  			.style("z-index", "10")
  			.style("visibility", "hidden")
  			.style("background", "lightyellow")
  			.style("opacity", "1")
  			.style("border", "1px")    
  			.style("border-radius", "4px")  
  			.style("padding","2px")
  			.attr("transform","translate("+(-1*(bb+b)) +",0)")
  			//.style("x", -(extra_width - b - bb))
			.text("test");

		var funcTooltip = d3.select("body")
  			.append("div")
			.attr("id","bpnodetooltip1")
  			.style("position", "absolute")
  			.style("z-index", "10")
  			.style("visibility", "hidden")
  			.style("background", "lightyellow")
  			.style("opacity", "1")
  			.style("border", "1px")    
  			.style("border-radius", "4px")  
  			.style("padding","2px")
  			.attr("transform","translate("+(bb) +",0)")
  			.style("x", 0)
			.text("test");
			
		[0,1].forEach(function(p){			
			d3.select("#"+bip.id)
				.select(".part"+p)
				.select(".mainbars")
				.selectAll(".mainbar")
				.classed("highlighted",false)
				.classed("clicked", false)
				.attr("id",function(d,i){
					if(p == 0){ //get rid of spaces
						return bip.id+p+displayed_taxa[i].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_");
						} else {
						return bip.id+p+displayed_funcs[i].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_");
					}
				})
				.on("mouseover",function(d, i){ 
					//if(d3.select(this).classed("highlighted") == false){ //if not already highlighted

					clickedBars = d3.select("#Genomes").selectAll(".mainbars").select(".clicked")
					if(clickedBars.empty()){
						if (p == 0) {
							matchedNode = d3.select("#node_"+displayed_taxa[d.key].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_"))
							avg_val = matchedNode.data()[0].sampleAvg
							taxaTooltip.html(generate_bipartite_node_tooltip(p, displayed_taxa[d.key], avg_val*100))
							taxaTooltip.style("visibility","visible")
							return highlightall(displayed_taxa[i],"",1);
						} else {
							matchedNode = d3.select("#node_"+displayed_funcs[d.key].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_"))
							avg_val = matchedNode.data()[0].sampleAvg
							funcTooltip.html(generate_bipartite_node_tooltip(p, displayed_funcs[d.key], avg_val*100))
							funcTooltip.style("visibility","visible")
							return highlightall("", displayed_funcs[i],2);
						}
					} else if(d3.select(this).classed("clicked")==true ){ //also show tooltip if clicked
						if (p == 0) {
							matchedNode = d3.select("#node_"+displayed_taxa[d.key].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_"))
							avg_val = matchedNode.data()[0].sampleAvg
							taxaTooltip.html(generate_bipartite_node_tooltip(p, displayed_taxa[d.key], avg_val*100))
							taxaTooltip.style("visibility","visible")
							//return highlightall(displayed_taxa[i],"",1);
						} else {
							matchedNode = d3.select("#node_"+displayed_funcs[d.key].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_"))
							avg_val = matchedNode.data()[0].sampleAvg
							funcTooltip.html(generate_bipartite_node_tooltip(p, displayed_funcs[d.key], avg_val*100))
							funcTooltip.style("visibility","visible")
							//return highlightall("", displayed_funcs[i],2);
						}						
					} else if(d3.select(this).classed("highlighted")==true){
						if (p == 0) {
							matchedNode = d3.select("#node_"+displayed_taxa[d.key].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_"))
							avg_val = matchedNode.data()[0].sampleAvg
							taxaTooltip.html(generate_bipartite_node_tooltip(p, displayed_taxa[d.key], avg_val*100))
							taxaTooltip.style("visibility","visible")
						} else {
							matchedNode = d3.select("#node_"+displayed_funcs[d.key].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_"))
							avg_val = matchedNode.data()[0].sampleAvg
							funcTooltip.html(generate_bipartite_node_tooltip(p, displayed_funcs[d.key], avg_val*100))
							funcTooltip.style("visibility","visible")						
						}					
					}
					
					//else do nothing
				//} 
				})						
				.on("mousemove", function(d){
					if(p == 0){
						taxaTooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+15)+"px");
					} else {
						funcTooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+15)+"px");
					}
				})
				.on("mouseout",function(d, i){ 
					p == 0 ? taxaTooltip.style("visibility", "hidden") : funcTooltip.style("visibility", "hidden");
					clickedBars = d3.select("#Genomes").selectAll(".mainbars").select(".clicked")
					if(clickedBars.empty()){
					//only de-highlight if not clicked on, and if none of its edges are clicked
					if(d3.select(this).classed("clicked") == false){
						if (p == 0) {
							assocEdges = d3.select("#Genomes").select(".edges").selectAll(".clicked").filter(function(f,k){ 
										return (f["key1"]==i); })
							if(assocEdges.empty()){
								return dehighlightall(displayed_taxa[i],"",1);
								} else{ //just make other edges not visible
									d3.select("#Genomes").select(".edges").selectAll(".edge").filter(function(f,k){ 
										return (f["key1"]==i); }).attr("visibility", function(m){
											if(d3.select(this).classed("clicked")==false){
												return "hidden";
											} else{
												return "visible";
											}
										})
										.style("opacity", 0);
								}
						} else {
							assocEdges = d3.select("#Genomes").select(".edges").selectAll(".clicked").filter(function(f,k){ 
										return (f["key2"]==i); })
							if(assocEdges.empty()){
								return dehighlightall("", displayed_funcs[i],2);
							} else{
									d3.select("#Genomes").select(".edges").selectAll(".edge").filter(function(f,k){ 
										return (f["key2"]==i); })
										.attr("visibility", function(m){
											if(d3.select(this).classed("clicked")==false){
												return "hidden";
											} else{
												return "visible";
											}
										})
										.style("opacity", 0);
							}
							
						}	
					}
				}

				})
				.on("click", function(d,i){
					current_id = d3.select(this).attr("id")
					if (p == 0){
						//show tooltip
						if(d3.select(this).classed("clicked")==false){
							matchedNode = d3.select("#node_"+displayed_taxa[d.key].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_"))
							avg_val = matchedNode.data()[0].sampleAvg
							taxaTooltip.html(generate_bipartite_node_tooltip(p, displayed_taxa[d.key],avg_val*100))
							taxaTooltip.style("visibility","visible")
						}
						current_name = displayed_taxa[i]
						list_type = "taxa"
					} else {
						if(d3.select(this).classed("clicked")==false){
							matchedNode = d3.select("#node_"+displayed_funcs[d.key].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_"))
							avg_val = matchedNode.data()[0].sampleAvg	
							funcTooltip.html(generate_bipartite_node_tooltip(p, displayed_funcs[d.key],avg_val*100))
							funcTooltip.style("visibility","visible")
						}	
						current_name = displayed_funcs[i]
						list_type = "funcs"
					}

					clickResponse(current_id, current_name, list_type, displayed_taxa, displayed_funcs)
				});		
		});
		
		return visData;
	} 
	

	bP.selectSegment = function(m, s, taxa_colors, func_colors, displayed_taxa, displayed_funcs, no_edges = false){ //s # of node, m which side of nodes
			// var newdata =  {keys:[], data:[]};	
				
			// newdata.keys = k.data.keys.map( function(d){ return d;});
			
			// newdata.data[m] = k.data.data[m].map( function(d){ return d;});
			
			// newdata.data[1-m] = k.data.data[1-m]
			// 	.map( function(v){ return v.map(function(d, i){ return (s==i ? d : 0);}); });
			
			// transition(visualize(newdata), k.id);
		
				
			var selectedBar = d3.select("#Genomes").select(".part"+m).select(".mainbars")
				.selectAll(".mainbar").filter(function(d,i){ return (i==s);}); //return sth element of main bar only
			
			//selectedBar.select(".mainrect").style("stroke-opacity",1);			
			selectedBar.select(".barlabel").style('font-weight','bold').style("visibility", "visible");

			if(m==1){
				var trimstr = displayed_funcs[s].replace(/\W+/g,'') + "_tx_func_bar";
				current_color = func_colors(displayed_funcs[s]) 
			} else {
				var trimstr = displayed_taxa[s].replace(/\W+/g,'') + "_tx";
				current_color = taxa_colors(displayed_taxa[s]);
			}
			if (d3.select("#" + trimstr)[0][0] == null) {
				col_switch = d3.rgb(current_color)
				if(col_switch["r"] > 230 ||col_switch["g"] > 230 || col_switch["b"] > 230){
					col_fill = col_switch
					} else {
					col_fill = col_switch.brighter(0.3)
					}
				var t
				if (m==1){
					t = textures.lines()
					  	.thicker()
					  	.orientation("diagonal", "6/8")
			    		.background(col_fill)
						.id(trimstr)
			    		.stroke("white");
			    } else {
			    	t = textures.lines()
			    		.thicker()
			    		.background(col_fill)
						.id(trimstr)
			    		.stroke("white");
			    }
				d3.select("#patternsvg").call(t);
			}

			selectedBar.select(".mainrect")
				.attr('fill-opacity',1)
				.style("fill", "url(#" + trimstr + ")");
			
			selectedBar.append("use").attr("xlink:href","#"+trimstr);
			
			if(no_edges == false){
			var selectedEdges = d3.select("#Genomes").select(".edges").selectAll(".edge")
				.filter(function(d,i){ return (d["key"+(m+1)]==s); });


			selectedEdges.attr("points", bP.edgePolygon2)
				.style("opacity", function(f){
					if(d3.select(this).classed("clicked")){
					return 1;
					} else {
						if(d3.selectAll(".edges").selectAll(".clicked").empty()){
							return 0.65;
						} else {
							return 0.2;
						}//else don't change
					}
				})
				.style("fill", function(f){ 
					if(d3.select(this).classed("highlighted") == true){
						if(d3.select("#Genomes1"+displayed_funcs[f["key2"]].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")).classed("clicked")){ //must be a highlighted function
							return taxa_colors(displayed_taxa[f["key1"]])
						} else {
							return func_colors(displayed_funcs[f["key2"]]);
						}
						//return(d3.select(this).style("fill")) //keep it whatever it is
					} else{
				if(m==0){
					return func_colors(displayed_funcs[f["key2"]]);	
				} else{
					return taxa_colors(displayed_taxa[f["key1"]]);
				}
				} })
// 				.attr("width", function(d){ 
// 					if(d.wid < 2){
// 						console.log(d.wid)
// 						return 2;
// 					} else {
// 						return d.wid;
// 					}
// 					})
				.attr("visibility", "visible");
			}
			//selectedEdges.select("_current").style("stroke-opacity", 1);
			//selectedBar.select(".barvalue").style('font-weight','bold');
			//selectedBar.select(".barpercent").style('font-weight','bold');
	}	
	
	bP.deSelectSegment = function(m, s, taxa_colors, func_colors, displayed_taxa, displayed_funcs){
		//transition(visualize(k.data), k.id);
		var selectedBar = d3.select("#Genomes").select(".part"+m).select(".mainbars")
			.selectAll(".mainbar").filter(function(d,i){ return (i==s);});

		if(selectedBar.classed("clicked")==false){
// 			var selSubBar = d3.select("#Genomes").select(".part"+m).select(".subbars").selectAll(".subbar")
// 				.filter(function(d,i){ return (d["key"+(m+1)]==s); }); //return sth element of main bar only
// 				selSubBar.style("opacity", 0.1);

			if(m==1){
				current_color = func_colors(displayed_funcs[s]) } else {
					current_color = taxa_colors(displayed_taxa[s]);
				}

			selectedBar.select(".barlabel").style('font-weight','normal'); //.style("visibility", "hidden");
			selectedBar.select(".mainrect")
			//.style('fill-opacity',.75)
				.style("fill", current_color);
		

			var selectedEdges = d3.select("#Genomes").select(".edges").selectAll('.edge')
				.filter(function(d,i){ 
				return (d["key"+(m+1)]==s); })

			selectedEdges.attr("visibility", function(d,i){
				if(d3.select(this).classed("highlighted") == false){ // if edge should not be visible
					return "hidden";
					} else {
					return "visible";
				}
			})
				.style("opacity", 0);
			}
// 		.attr("fill", function(d,i){
// 			//reset fill for highlighted taxa
// 			if(d3.select(this).classed("highlighted") == true){
// 				selBarTaxa = d3.select("Genomes0").select(".highlighted")
// 				if(selBarTaxa.length > 0){
// 					return taxa_colors(displayed_taxa[d["key1"]]);
// 				} else {
// 					return func_colors(displayed_funcs[d["key2"]]);
// 				}
// 			}
// 		});
		
			//.style("opacity", 0.2)
			//.style("fill", "grey")
			//.attr("points", bP.edgePolygon);

		//selectedBar.select(".barvalue").style('font-weight','normal');
		//selectedBar.select(".barpercent").style('font-weight','normal');
	}

	bP.selectEdge = function(id, i, current_data, taxa_colors, func_colors, displayed_taxa, displayed_funcs, highlightall){
		//bold associated names
		[0,1].forEach(function(m){
		var selectedBar = d3.select("#Genomes").select(".part"+m).select(".mainbars")
			.selectAll(".mainbar").filter(function(d,i){ 
				return (i==current_data["key"+(m+1)]);});
			selectedBar.select(".barlabel").style('font-weight','bold').style("visibility", "visible");

			if(m==1){
				var trimstr = displayed_funcs[current_data["key"+(m+1)]].replace(/\W+/g,'') + "_tx_contribution";
				current_color = d3.rgb(func_colors(displayed_funcs[current_data["key"+(m+1)]])) 
			} else {
				var trimstr = displayed_taxa[current_data["key"+(m+1)]].replace(/\W+/g,'') + "_tx";
				current_color = d3.rgb(taxa_colors(displayed_taxa[current_data["key"+(m+1)]]));
			}

			if (d3.select("#" + trimstr)[0][0] == null) {
				col_switch = d3.rgb(current_color)
				if(col_switch["r"] > 230 ||col_switch["g"] > 230 || col_switch["b"] > 230){
					col_fill = col_switch
					} else {
					col_fill = col_switch.brighter(0.3)
					}
				var t = textures.lines()
			    		.thicker()
			    		.background(col_fill)
						.id(trimstr)
			    		.stroke("white");

				d3.select("#patternsvg").call(t);
			}

			selectedBar.select(".mainrect")
				.style('fill-opacity',1)
				.style("fill", "url(#" + trimstr + ")");

			var selSubBar =  d3.select("#"+id).select(".part"+m).select(".subbars")
				.selectAll(".subbar")
				.filter(function(d,i){ 
					return (d["key"+(m+1)]==current_data["key"+(m+1)]); }); 

			selSubBar.style("opacity", 1);

		highlightall(displayed_taxa[current_data["key1"]], displayed_funcs[current_data["key2"]], 3);
		});
	}

	bP.deselectEdge = function(id, i, current_data, displayed_taxa, displayed_funcs, dehighlightall, taxa_colors, func_colors){
		d3.select(this).style("opacity",0)
		[0,1].forEach(function(m){
		var selectedBar = d3.select("#"+id).select(".part"+m).select(".mainbars")
			.selectAll(".mainbar").filter(function(d,i){ 
				return (i==current_data["key"+(m+1)]);});
		selectedBar.select(".barlabel").style('font-weight','normal')//.style("visibility", "hidden");
		if(m==1){
			current_color = func_colors(displayed_funcs[current_data["key"+(m+1)]]) } else {
			current_color = taxa_colors(displayed_taxa[current_data["key"+(m+1)]]);
		}

		selectedBar.select(".mainrect")
			//.style("fill-opacity",.75)
			.style("fill", current_color)


		var selSubBar =  d3.select("#"+id).select(".part"+m).select(".subbars")
			.selectAll(".subbar")
			.filter(function(d,i){ 
				return (d["key"+(m+1)]==current_data["key"+(m+1)]); }); 
		selSubBar.style("opacity", 0.8);
		});		
		dehighlightall(displayed_taxa[current_data["key1"]], displayed_funcs[current_data["key2"]], 3);

	}

		// function transitionPart(data, id, p){
	// 	var mainbar = d3.select("#"+id).select(".part"+p).select(".mainbars")
	// 		.selectAll(".mainbar").data(data.mainBars[p]);
		
	// 	mainbar.select(".mainrect").transition().duration(500)
	// 		.attr("y",function(d){ return d.middle-d.height/2;})
	// 		.attr("height",function(d){ return d.height;});
			
	// 	mainbar.select(".barlabel").transition().duration(500)
	// 		.attr("y",function(d){ return d.middle+5;});
			
	// 	mainbar.select(".barvalue").transition().duration(500)
	// 		.attr("y",function(d){ return d.middle+5;}).text(function(d,i){ return d.value ;});
			
	// 	mainbar.select(".barpercent").transition().duration(500)
	// 		.attr("y",function(d){ return d.middle+5;})
	// 		//.text(function(d,i){ return "( "+Math.round(100*d.percent)+"%)" ;});
			
	// 	d3.select("#"+id).select(".part"+p).select(".subbars")
	// 		.selectAll(".subbar").data(data.subBars[p])
	// 		.transition().duration(500)
	// 		.attr("y",function(d){ return d.y}).attr("height",function(d){ return d.h});
	// }
	
	// function transitionEdges(data, id){
	// 	d3.select("#"+id).append("g").attr("class","edges")
	// 		.attr("transform","translate("+ b+",0)");

	// 	d3.select("#"+id).select(".edges").selectAll(".edge").data(data.edges)
	// 		.transition().duration(500)
	// 		.attrTween("points", arcTween)
	// 		.style("opacity",function(d){ return (d.h1 ==0 || d.h2 == 0 ? 0 : 0.5);});	
	// }
	
	// function transition(data, id){
	// 	transitionPart(data, id, 0);
	// 	transitionPart(data, id, 1);
	// 	transitionEdges(data, id);
	// }
	

	this.bP = bP;
})();
