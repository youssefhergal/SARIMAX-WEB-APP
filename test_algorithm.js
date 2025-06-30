const r = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const coeff = [1, 1, 1];
const lag = 3;
const h = 1;  // how many steps ahead to forecast
 
const predictions = [];
const max_steps = r.length - lag - h + 1;
 
console.log('Input data:', r);
console.log('Coefficients:', coeff);
console.log('Lag:', lag);
console.log('Horizon (h):', h);
console.log('max_steps:', max_steps);
console.log('\n--- Starting Algorithm ---');

for (let i = 0; i < max_steps; i += h) {
    console.log(`\nIteration ${i/h}, i=${i}`);
    
    // start with lag real values
    let context = r.slice(i, i + lag);
    console.log('Initial context (real data):', context);
    
    const future = [];
 
    for (let step = 0; step < h; step++) {
        let value = 0;
        for (let j = 0; j < lag; j++) {
            value += context[j] * coeff[j];
        }
        
        console.log(`  Step ${step}: context=[${context.join(',')}] → prediction=${value}`);
        future.push(value);

        // slide the context window by 1 and add the new prediction
        context = context.slice(1).concat(value);
        console.log(`  Updated context: [${context.join(',')}]`);
    }
 
    predictions.push(future);
    console.log('Future predictions for this iteration:', future);
}
 
console.log('\n--- Final Results ---');
console.log('All predictions:', predictions);
console.log('Flattened predictions:', predictions.flat());

// Let's also test with h = 2 to see multi-step behavior
console.log('\n\n=== Testing with h = 2 ===');
const h2 = 2;
const predictions2 = [];
const max_steps2 = r.length - lag - h2 + 1;

console.log('max_steps with h=2:', max_steps2);

for (let i = 0; i < max_steps2; i += h2) {
    console.log(`\nIteration ${i/h2}, i=${i}`);
    
    let context = r.slice(i, i + lag);
    console.log('Initial context (real data):', context);
    
    const future = [];
 
    for (let step = 0; step < h2; step++) {
        let value = 0;
        for (let j = 0; j < lag; j++) {
            value += context[j] * coeff[j];
        }
        
        console.log(`  Step ${step}: context=[${context.join(',')}] → prediction=${value}`);
        future.push(value);
        context = context.slice(1).concat(value);
    }
 
    predictions2.push(future);
    console.log('Future predictions for this iteration:', future);
}

console.log('\nPredictions with h=2:', predictions2); 