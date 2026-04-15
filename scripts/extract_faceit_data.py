#!/usr/bin/env python3
"""
FACEIT Match Data Extractor
Extrai dados de partidas do FACEIT e gera JSON pronto para o site Liga Tucuruí CS2
"""

import requests
import json
import sys
from typing import Dict, List, Optional
from datetime import datetime
import re

class FACEITExtractor:
    """Extrator de dados do FACEIT API"""
    
    def __init__(self, api_key: str):
        """
        Inicializa o extrator com API key
        
        Args:
            api_key: Chave da API do FACEIT
        """
        self.api_key = api_key
        self.base_url = "https://api.faceit.com/data/v4"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def get_match_details(self, match_id: str) -> Optional[Dict]:
        """
        Obtém detalhes da partida
        
        Args:
            match_id: ID da partida no FACEIT
            
        Returns:
            Dicionário com detalhes da partida ou None se erro
        """
        try:
            url = f"{self.base_url}/matches/{match_id}"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro ao obter detalhes da partida: {e}")
            return None
    
    def get_match_stats(self, match_id: str) -> Optional[Dict]:
        """
        Obtém estatísticas da partida
        
        Args:
            match_id: ID da partida no FACEIT
            
        Returns:
            Dicionário com estatísticas ou None se erro
        """
        try:
            url = f"{self.base_url}/matches/{match_id}/stats"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro ao obter estatísticas: {e}")
            return None
    
    def extract_match_id_from_url(self, url: str) -> Optional[str]:
        """
        Extrai ID da partida da URL do FACEIT
        
        Args:
            url: URL do FACEIT (ex: https://www.faceit.com/pt/cs2/room/1-xxxxx/scoreboard/summary)
            
        Returns:
            ID da partida ou None se não encontrado
        """
        # Padrão: 1-{uuid}
        match = re.search(r'1-([a-f0-9\-]+)', url)
        if match:
            return match.group(1)
        return None
    
    def parse_player_stats(self, player_data: Dict) -> Dict:
        """
        Processa dados de um jogador
        
        Args:
            player_data: Dados brutos do jogador
            
        Returns:
            Dicionário formatado com stats do jogador
        """
        stats = player_data.get("stats", {})
        
        # Extrair valores com fallback para 0
        kills = int(stats.get("Kills", 0))
        deaths = int(stats.get("Deaths", 0))
        assists = int(stats.get("Assists", 0))
        
        # Calcular K/D ratio
        kd_ratio = kills / deaths if deaths > 0 else kills
        
        # Extrair percentual de headshots
        hs_percent = float(stats.get("Headshots %", 0))
        
        # Extrair RWS (Round Win Share) - pode estar em diferentes formatos
        rws = float(stats.get("RWS", stats.get("Round Win Share", 0)))
        
        # Extrair Rating (Rating 3.0)
        rating = float(stats.get("Rating", stats.get("Rating 3.0", 1.0)))
        
        # Extrair ADR (Average Damage per Round)
        adr = float(stats.get("ADR", stats.get("Average Damage per Round", 0)))
        
        # Extrair KAST (Kill/Assist/Survival/Traded)
        kast = float(stats.get("KAST", 0))
        
        # Extrair dano
        damage = int(stats.get("Total Damage", stats.get("Damage", 0)))
        
        # Extrair utilidades
        utility = int(stats.get("Utility Damage", 0))
        
        # Extrair multikills (pode estar em diferentes formatos)
        multikills = stats.get("Multikills", "0")
        first_kills = int(stats.get("First Kills", 0))
        
        return {
            "name": player_data.get("nickname", "Unknown"),
            "rating": round(rating, 3),
            "damage": damage,
            "utility": utility,
            "rws": round(rws, 2),
            "kills": kills,
            "deaths": deaths,
            "assists": assists,
            "adr": round(adr, 1),
            "kast": round(kast, 1),
            "hsPercent": round(hs_percent, 1),
            "firstKills": first_kills,
            "multikills": str(multikills)
        }
    
    def parse_team_stats(self, team_data: Dict) -> Dict:
        """
        Processa estatísticas agregadas de um time
        
        Args:
            team_data: Dados do time
            
        Returns:
            Dicionário com stats agregadas
        """
        players = team_data.get("players", [])
        
        total_kills = sum(int(p.get("stats", {}).get("Kills", 0)) for p in players)
        total_deaths = sum(int(p.get("stats", {}).get("Deaths", 0)) for p in players)
        
        kd_ratio = total_kills / total_deaths if total_deaths > 0 else total_kills
        
        # Calcular ADR médio
        adrs = [float(p.get("stats", {}).get("ADR", 0)) for p in players]
        avg_adr = sum(adrs) / len(adrs) if adrs else 0
        
        # Calcular rating médio
        ratings = [float(p.get("stats", {}).get("Rating", 1.0)) for p in players]
        team_avg_rating = sum(ratings) / len(ratings) if ratings else 1.0
        
        return {
            "totalKills": total_kills,
            "totalDeaths": total_deaths,
            "kdRatio": round(kd_ratio, 2),
            "avgADR": round(avg_adr, 1),
            "teamAvgRating": round(team_avg_rating, 3)
        }
    
    def extract_match_data(self, match_url: str, round_num: int, team1_name: str, team2_name: str) -> Optional[Dict]:
        """
        Extrai todos os dados de uma partida
        
        Args:
            match_url: URL da partida no FACEIT
            round_num: Número da rodada
            team1_name: Nome do time 1
            team2_name: Nome do time 2
            
        Returns:
            Dicionário com dados formatados para o site ou None se erro
        """
        # Extrair ID da partida
        match_id = self.extract_match_id_from_url(match_url)
        if not match_id:
            print(f"❌ Não foi possível extrair ID da partida da URL: {match_url}")
            return None
        
        print(f"🔍 Extraindo dados da partida: {match_id}")
        
        # Obter detalhes e stats
        match_details = self.get_match_details(match_id)
        match_stats = self.get_match_stats(match_id)
        
        if not match_details or not match_stats:
            print("❌ Falha ao obter dados da partida")
            return None
        
        # Extrair informações básicas
        teams = match_stats.get("teams", [])
        if len(teams) < 2:
            print("❌ Dados incompletos: menos de 2 times encontrados")
            return None
        
        team1_data = teams[0]
        team2_data = teams[1]
        
        # Determinar vencedor
        team1_score = team1_data.get("prematch_expected_outcome", {}).get("wins", 0)
        team2_score = team2_data.get("prematch_expected_outcome", {}).get("wins", 0)
        
        # Tentar extrair score do resultado
        match_result = match_details.get("results", [])
        if match_result:
            team1_score = match_result[0].get("score", 0)
            team2_score = match_result[1].get("score", 0) if len(match_result) > 1 else 0
        
        winner = team1_name if team1_score > team2_score else team2_name
        
        # Extrair mapa
        map_name = match_details.get("competition_id", "UNKNOWN")
        # Tentar extrair do nome da competição
        if "mirage" in str(map_name).lower():
            map_name = "MIRAGE"
        elif "inferno" in str(map_name).lower():
            map_name = "INFERNO"
        elif "nuke" in str(map_name).lower():
            map_name = "NUKE"
        elif "ancient" in str(map_name).lower():
            map_name = "ANCIENT"
        elif "vertigo" in str(map_name).lower():
            map_name = "VERTIGO"
        elif "dust2" in str(map_name).lower():
            map_name = "DUST2"
        elif "train" in str(map_name).lower():
            map_name = "TRAIN"
        else:
            map_name = "UNKNOWN"
        
        # Processar jogadores
        team1_players = [self.parse_player_stats(p) for p in team1_data.get("players", [])]
        team2_players = [self.parse_player_stats(p) for p in team2_data.get("players", [])]
        
        # Processar stats de time
        team1_stats = self.parse_team_stats(team1_data)
        team2_stats = self.parse_team_stats(team2_data)
        
        # Montar resultado final
        result = {
            "id": f"match-{round_num}",
            "matchUrl": match_url,
            "round": round_num,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "team1": team1_name,
            "team2": team2_name,
            "score1": team1_score,
            "score2": team2_score,
            "winner": winner,
            "map": map_name,
            "team1Players": team1_players,
            "team2Players": team2_players,
            "team1Stats": team1_stats,
            "team2Stats": team2_stats
        }
        
        return result
    
    def generate_typescript_code(self, match_data: Dict) -> str:
        """
        Gera código TypeScript para adicionar ao arquivo championship.ts
        
        Args:
            match_data: Dados da partida
            
        Returns:
            String com código TypeScript formatado
        """
        json_str = json.dumps(match_data, indent=2)
        
        code = f"""
// Adicione este objeto à array MATCHES em client/src/data/championship.ts

{json_str},
"""
        return code


def main():
    """Função principal"""
    
    # Verificar argumentos
    if len(sys.argv) < 4:
        print("❌ Uso: python extract_faceit_data.py <api_key> <match_url> <round> [team1] [team2]")
        print("")
        print("Exemplo:")
        print("  python extract_faceit_data.py YOUR_API_KEY https://www.faceit.com/pt/cs2/room/1-xxxxx/scoreboard/summary 2 'Bonde do Franja' 'Os Pikinhas'")
        print("")
        print("Argumentos:")
        print("  api_key      - Sua chave da API do FACEIT (obtenha em https://developers.faceit.com)")
        print("  match_url    - URL completa da partida no FACEIT")
        print("  round        - Número da rodada")
        print("  team1        - Nome do time 1 (opcional, padrão: Team 1)")
        print("  team2        - Nome do time 2 (opcional, padrão: Team 2)")
        sys.exit(1)
    
    api_key = sys.argv[1]
    match_url = sys.argv[2]
    round_num = int(sys.argv[3])
    team1_name = sys.argv[4] if len(sys.argv) > 4 else "Team 1"
    team2_name = sys.argv[5] if len(sys.argv) > 5 else "Team 2"
    
    # Criar extrator
    extractor = FACEITExtractor(api_key)
    
    print("=" * 60)
    print("🎮 FACEIT Match Data Extractor")
    print("=" * 60)
    print(f"📍 Match URL: {match_url}")
    print(f"🔢 Round: {round_num}")
    print(f"👥 Teams: {team1_name} vs {team2_name}")
    print("=" * 60)
    print("")
    
    # Extrair dados
    match_data = extractor.extract_match_data(match_url, round_num, team1_name, team2_name)
    
    if not match_data:
        print("❌ Falha ao extrair dados")
        sys.exit(1)
    
    # Exibir resultado
    print("✅ Dados extraídos com sucesso!")
    print("")
    print("📊 Resultado:")
    print(f"   {match_data['team1']} {match_data['score1']} x {match_data['score2']} {match_data['team2']}")
    print(f"   Vencedor: {match_data['winner']}")
    print(f"   Mapa: {match_data['map']}")
    print("")
    
    # Gerar código TypeScript
    ts_code = extractor.generate_typescript_code(match_data)
    
    # Salvar em arquivo
    output_file = f"match_{round_num}_data.ts"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(ts_code)
    
    print(f"💾 Código TypeScript salvo em: {output_file}")
    print("")
    print("📋 Próximos passos:")
    print(f"   1. Abra o arquivo {output_file}")
    print("   2. Copie o conteúdo")
    print("   3. Cole na array MATCHES do arquivo client/src/data/championship.ts")
    print("   4. Salve e faça deploy")
    print("")
    print("=" * 60)


if __name__ == "__main__":
    main()
