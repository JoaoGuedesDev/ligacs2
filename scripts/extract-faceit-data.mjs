#!/usr/bin/env node

/**
 * FACEIT Match Data Extractor (Node.js)
 * Extrai dados de partidas do FACEIT e gera JSON pronto para o site Liga Tucuruí CS2
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class FACEITExtractor {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.faceit.com/data/v4';
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async getMatchDetails(matchId) {
    try {
      const url = `${this.baseUrl}/matches/${matchId}`;
      const response = await fetch(url, { headers: this.headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`❌ Erro ao obter detalhes da partida: ${error.message}`);
      return null;
    }
  }

  async getMatchStats(matchId) {
    try {
      const url = `${this.baseUrl}/matches/${matchId}/stats`;
      const response = await fetch(url, { headers: this.headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`❌ Erro ao obter estatísticas: ${error.message}`);
      return null;
    }
  }

  extractMatchIdFromUrl(url) {
    const match = url.match(/1-([a-f0-9\-]+)/);
    return match ? match[1] : null;
  }

  parsePlayerStats(playerData) {
    const stats = playerData.stats || {};

    const kills = parseInt(stats.Kills || 0);
    const deaths = parseInt(stats.Deaths || 0);
    const assists = parseInt(stats.Assists || 0);
    const kdRatio = deaths > 0 ? kills / deaths : kills;
    const hsPercent = parseFloat(stats['Headshots %'] || 0);
    const rws = parseFloat(stats.RWS || stats['Round Win Share'] || 0);
    const rating = parseFloat(stats.Rating || stats['Rating 3.0'] || 1.0);
    const adr = parseFloat(stats.ADR || stats['Average Damage per Round'] || 0);
    const kast = parseFloat(stats.KAST || 0);
    const damage = parseInt(stats['Total Damage'] || stats.Damage || 0);
    const utility = parseInt(stats['Utility Damage'] || 0);
    const multikills = stats.Multikills || '0';
    const firstKills = parseInt(stats['First Kills'] || 0);

    return {
      name: playerData.nickname || 'Unknown',
      rating: Math.round(rating * 1000) / 1000,
      damage,
      utility,
      rws: Math.round(rws * 100) / 100,
      kills,
      deaths,
      assists,
      adr: Math.round(adr * 10) / 10,
      kast: Math.round(kast * 10) / 10,
      hsPercent: Math.round(hsPercent * 10) / 10,
      firstKills,
      multikills: String(multikills)
    };
  }

  parseTeamStats(teamData) {
    const players = teamData.players || [];

    const totalKills = players.reduce((sum, p) => sum + parseInt(p.stats?.Kills || 0), 0);
    const totalDeaths = players.reduce((sum, p) => sum + parseInt(p.stats?.Deaths || 0), 0);
    const kdRatio = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;

    const adrs = players.map(p => parseFloat(p.stats?.ADR || 0));
    const avgAdr = adrs.length > 0 ? adrs.reduce((a, b) => a + b, 0) / adrs.length : 0;

    const ratings = players.map(p => parseFloat(p.stats?.Rating || 1.0));
    const teamAvgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 1.0;

    return {
      totalKills,
      totalDeaths,
      kdRatio: Math.round(kdRatio * 100) / 100,
      avgADR: Math.round(avgAdr * 10) / 10,
      teamAvgRating: Math.round(teamAvgRating * 1000) / 1000
    };
  }

  extractMapName(competitionId) {
    const mapStr = String(competitionId).toLowerCase();
    const maps = ['mirage', 'inferno', 'nuke', 'ancient', 'vertigo', 'dust2', 'train'];
    
    for (const map of maps) {
      if (mapStr.includes(map)) return map.toUpperCase();
    }
    
    return 'UNKNOWN';
  }

  async extractMatchData(matchUrl, roundNum, team1Name, team2Name) {
    const matchId = this.extractMatchIdFromUrl(matchUrl);
    if (!matchId) {
      console.error(`❌ Não foi possível extrair ID da partida da URL: ${matchUrl}`);
      return null;
    }

    console.log(`🔍 Extraindo dados da partida: ${matchId}`);

    const matchDetails = await this.getMatchDetails(matchId);
    const matchStats = await this.getMatchStats(matchId);

    if (!matchDetails || !matchStats) {
      console.error('❌ Falha ao obter dados da partida');
      return null;
    }

    const teams = matchStats.teams || [];
    if (teams.length < 2) {
      console.error('❌ Dados incompletos: menos de 2 times encontrados');
      return null;
    }

    const team1Data = teams[0];
    const team2Data = teams[1];

    let team1Score = 0;
    let team2Score = 0;

    const matchResult = matchDetails.results || [];
    if (matchResult.length > 0) {
      team1Score = matchResult[0].score || 0;
      team2Score = matchResult.length > 1 ? matchResult[1].score || 0 : 0;
    }

    const winner = team1Score > team2Score ? team1Name : team2Name;
    const mapName = this.extractMapName(matchDetails.competition_id || '');

    const team1Players = (team1Data.players || []).map(p => this.parsePlayerStats(p));
    const team2Players = (team2Data.players || []).map(p => this.parsePlayerStats(p));

    const team1Stats = this.parseTeamStats(team1Data);
    const team2Stats = this.parseTeamStats(team2Data);

    return {
      id: `match-${roundNum}`,
      matchUrl,
      round: roundNum,
      date: new Date().toISOString().split('T')[0],
      team1: team1Name,
      team2: team2Name,
      score1: team1Score,
      score2: team2Score,
      winner,
      map: mapName,
      team1Players,
      team2Players,
      team1Stats,
      team2Stats
    };
  }

  generateTypeScriptCode(matchData) {
    const jsonStr = JSON.stringify(matchData, null, 2);
    return `
// Adicione este objeto à array MATCHES em client/src/data/championship.ts

${jsonStr},
`;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('❌ Uso: node extract-faceit-data.mjs <api_key> <match_url> <round> [team1] [team2]');
    console.log('');
    console.log('Exemplo:');
    console.log('  node extract-faceit-data.mjs YOUR_API_KEY https://www.faceit.com/pt/cs2/room/1-xxxxx/scoreboard/summary 2 "Bonde do Franja" "Os Pikinhas"');
    console.log('');
    console.log('Argumentos:');
    console.log('  api_key      - Sua chave da API do FACEIT (obtenha em https://developers.faceit.com)');
    console.log('  match_url    - URL completa da partida no FACEIT');
    console.log('  round        - Número da rodada');
    console.log('  team1        - Nome do time 1 (opcional, padrão: Team 1)');
    console.log('  team2        - Nome do time 2 (opcional, padrão: Team 2)');
    process.exit(1);
  }

  const apiKey = args[0];
  const matchUrl = args[1];
  const roundNum = parseInt(args[2]);
  const team1Name = args[3] || 'Team 1';
  const team2Name = args[4] || 'Team 2';

  const extractor = new FACEITExtractor(apiKey);

  console.log('='.repeat(60));
  console.log('🎮 FACEIT Match Data Extractor');
  console.log('='.repeat(60));
  console.log(`📍 Match URL: ${matchUrl}`);
  console.log(`🔢 Round: ${roundNum}`);
  console.log(`👥 Teams: ${team1Name} vs ${team2Name}`);
  console.log('='.repeat(60));
  console.log('');

  const matchData = await extractor.extractMatchData(matchUrl, roundNum, team1Name, team2Name);

  if (!matchData) {
    console.error('❌ Falha ao extrair dados');
    process.exit(1);
  }

  console.log('✅ Dados extraídos com sucesso!');
  console.log('');
  console.log('📊 Resultado:');
  console.log(`   ${matchData.team1} ${matchData.score1} x ${matchData.score2} ${matchData.team2}`);
  console.log(`   Vencedor: ${matchData.winner}`);
  console.log(`   Mapa: ${matchData.map}`);
  console.log('');

  const tsCode = extractor.generateTypeScriptCode(matchData);
  const outputFile = path.join(__dirname, `match_${roundNum}_data.ts`);

  fs.writeFileSync(outputFile, tsCode, 'utf-8');

  console.log(`💾 Código TypeScript salvo em: ${outputFile}`);
  console.log('');
  console.log('📋 Próximos passos:');
  console.log(`   1. Abra o arquivo ${outputFile}`);
  console.log('   2. Copie o conteúdo');
  console.log('   3. Cole na array MATCHES do arquivo client/src/data/championship.ts');
  console.log('   4. Salve e faça deploy');
  console.log('');
  console.log('='.repeat(60));
}

main().catch(console.error);
