import { calculateRoute } from './src/services/mapRoutingService';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('=== INICIANDO TESTE AUTOMÁTICO DE ROTEAMENTO MOÇAMBIQUE ===\n');

  try {
    // Teste 1: Maputo → Xai-Xai (deve retornar ~210-220 km)
    console.log('Executando Rota 1/3: Maputo -> Xai-Xai...');
    const result1 = await calculateRoute('Maputo', 'Xai-Xai');
    console.log(`-> Sucesso! Distância: ${result1.distanceKm.toFixed(1)} km`);
    console.log(`-> Duração: ${result1.durationMinutes} minutos`);
    console.log(`-> Provedor: ${result1.routeProvider}\n`);

    if (result1.distanceKm < 185 || result1.distanceKm > 245) {
      throw new Error(`Falha: Distância fora do esperado para Maputo -> Xai-Xai (esperado ~210-220 km), recebido: ${result1.distanceKm} km`);
    }

    console.log('Aguardando 1.5s para evitar rate limiting do Nominatim...');
    await sleep(1500);

    // Teste 2: Maputo → Beira (deve retornar uma distância diferente)
    console.log('Executando Rota 2/3: Maputo -> Beira...');
    const result2 = await calculateRoute('Maputo', 'Beira');
    console.log(`-> Sucesso! Distância: ${result2.distanceKm.toFixed(1)} km`);
    console.log(`-> Duração: ${result2.durationMinutes} minutos`);
    console.log(`-> Provedor: ${result2.routeProvider}\n`);

    if (Math.abs(result1.distanceKm - result2.distanceKm) < 100) {
      throw new Error(`Falha: Distância para Beira é muito similar à de Xai-Xai! Recebido Beira: ${result2.distanceKm} km`);
    }

    console.log('Aguardando 1.5s para evitar rate limiting do Nominatim...');
    await sleep(1500);

    // Teste 3: Maputo → Matola (deve retornar uma distância diferente)
    console.log('Executando Rota 3/3: Maputo -> Matola...');
    const result3 = await calculateRoute('Maputo', 'Matola');
    console.log(`-> Sucesso! Distância: ${result3.distanceKm.toFixed(1)} km`);
    console.log(`-> Duração: ${result3.durationMinutes} minutos`);
    console.log(`-> Provedor: ${result3.routeProvider}\n`);

    if (Math.abs(result1.distanceKm - result3.distanceKm) < 50) {
      throw new Error(`Falha: Distância para Matola é muito similar à de Xai-Xai! Recebido Matola: ${result3.distanceKm} km`);
    }

    if (result3.distanceKm > 50) {
      throw new Error(`Falha: Matola é uma cidade colada a Maputo, a distância não deve passar de 50 km. Recebido: ${result3.distanceKm} km`);
    }

    console.log('===================================================');
    console.log('✅ TODOS OS TESTES PASSARAM COM SUCESSO!');
    console.log(`   Maputo -> Xai-Xai: ${result1.distanceKm.toFixed(1)} km (Esperado: ~210-220 km)`);
    console.log(`   Maputo -> Beira: ${result2.distanceKm.toFixed(1)} km (Deveria ser muito maior)`);
    console.log(`   Maputo -> Matola: ${result3.distanceKm.toFixed(1)} km (Deveria ser menor)`);
    console.log('===================================================');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ FALHA NOS TESTES DE ROTEAMENTO:', error.message || error);
    process.exit(1);
  }
}

runTests();
