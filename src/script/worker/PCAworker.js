importScripts("../../js/d3.v4.js");
importScripts("../../js/PCA.js");
importScripts("../../js/underscore-min.js");
importScripts("../../js/simple-statistics.min.js");

let canvasopt,totalTime_marker,dataIn;
addEventListener('message',function ({data}){
    switch (data.action) {
        case "initcanvas":
            // canvas = data.canvas;
            canvasopt = data.canvasopt;
            // gl = canvas.getContext("2d");
            break;

        case "initDataRaw":
            postMessage({action:'message', value:{'percentage':20,'message':'Data received. Process data...'}});
            let mask = data.mask;
            totalTime_marker = performance.now();
            if (data.opt.timeFactor) {
                let timeFactor = data.maxTimeStep/data.opt.timeFactor;
                console.log(data.maxTimeStep,'timeFactor=',timeFactor);
                dataIn = data.value.map(d => {
                    let temp = d.filter((e, i) => mask[i]);
                    temp.push(d.__timestep /timeFactor);
                    return temp;
                });
            }else
                dataIn = data.value.map(d=>{
                    return d.filter((e,i)=>mask[i]);
                });
            postMessage({action:'message', value:{'percentage':50,'message':'Init PCA'}});
            // pca - compute cluster position
            let pca = new PCA();
            // console.log(brand_names);
            // let matrix = pca.scale(dataIn, true, true);
            let matrix = pca.scale(dataIn, false, false);

            let pc = pca.pca(matrix, data.opt.dim);

            let A = pc[0];  // this is the U matrix from SVD
            // let B = pc[1];  // this is the dV matrix from SVD
            let chosenPC = pc[2];   // this is the most value of PCA
            let solution = dataIn.map((d,i)=>d3.range(0,data.opt.dim).map(dim=>A[i][chosenPC[dim]]));
            postMessage({action:'message', value:{'percentage':60,'message':'Generate projection'}});
            render(solution);
            postMessage({action:'stable', status:"done"});
            break;
    }
});

function render(sol){
    let xrange = d3.extent(sol, d => d[0]);
    let yrange = d3.extent(sol, d => d[1]);
    let xscale = d3.scaleLinear().range([0, canvasopt.width]);
    let yscale = d3.scaleLinear().range([0, canvasopt.height]);
    const ratio = canvasopt.height / canvasopt.width;
    if ((yrange[1] - yrange[0]) / (xrange[1] - xrange[0]) > canvasopt.height / canvasopt.width) {
        yscale.domain(yrange);
        let delta = ((yrange[1] - yrange[0]) / ratio - (xrange[1] - xrange[0])) / 2;
        xscale.domain([xrange[0] - delta, xrange[1] + delta])
    } else {
        xscale.domain(xrange);
        let delta = ((xrange[1] - xrange[0]) * ratio - (yrange[1] - yrange[0])) / 2;
        yscale.domain([yrange[0] - delta, yrange[1] + delta])
    }
    postMessage({action:'render',value:{totalTime:performance.now()-totalTime_marker},xscale:{domain:xscale.domain()}, yscale:{domain:yscale.domain()}, sol:sol});
    solution = sol;
}
