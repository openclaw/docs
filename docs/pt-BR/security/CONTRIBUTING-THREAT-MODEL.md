---
read_when:
    - Você quer contribuir com achados de segurança ou cenários de ameaça
    - Revisando ou atualizando o modelo de ameaças
summary: Como contribuir para o modelo de ameaças do OpenClaw
title: Contribuindo para o modelo de ameaças
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T06:12:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21cf130c2d8641b66b87de86a3ea718cd7c751c29ed9bf5e0bd76b43d65d0964
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# Contribuindo para o modelo de ameaças do OpenClaw

Obrigado por ajudar a tornar o OpenClaw mais seguro. Este modelo de ameaças é um documento vivo e recebemos contribuições de qualquer pessoa - você não precisa ser especialista em segurança.

## Formas de contribuir

### Adicionar uma ameaça

Percebeu um vetor de ataque ou risco que ainda não cobrimos? Abra uma issue em [openclaw/trust](https://github.com/openclaw/trust/issues) e descreva com suas próprias palavras. Você não precisa conhecer frameworks nem preencher todos os campos - basta descrever o cenário.

**É útil incluir (mas não é obrigatório):**

- O cenário de ataque e como ele poderia ser explorado
- Quais partes do OpenClaw são afetadas (CLI, gateway, canais, ClawHub, servidores MCP etc.)
- Qual a gravidade que você acha que isso tem (baixa / média / alta / crítica)
- Quaisquer links para pesquisas relacionadas, CVEs ou exemplos do mundo real

Nós cuidaremos do mapeamento ATLAS, IDs de ameaça e avaliação de risco durante a revisão. Se você quiser incluir esses detalhes, ótimo - mas não é esperado.

> **Isto serve para adicionar ao modelo de ameaças, não para relatar vulnerabilidades ativas.** Se você encontrou uma vulnerabilidade explorável, consulte nossa [página Trust](https://trust.openclaw.ai) para instruções de divulgação responsável.

### Sugerir uma mitigação

Tem uma ideia de como lidar com uma ameaça existente? Abra uma issue ou PR referenciando a ameaça. Mitigações úteis são específicas e acionáveis - por exemplo, "limitação por remetente de 10 mensagens/minuto no gateway" é melhor do que "implementar rate limiting".

### Propor uma cadeia de ataque

Cadeias de ataque mostram como múltiplas ameaças se combinam em um cenário realista de ataque. Se você identificar uma combinação perigosa, descreva as etapas e como um invasor as encadearia. Uma narrativa curta de como o ataque se desenrola na prática é mais valiosa do que um modelo formal.

### Corrigir ou melhorar conteúdo existente

Erros de digitação, esclarecimentos, informações desatualizadas, exemplos melhores - PRs são bem-vindos, sem necessidade de abrir issue.

## O que usamos

### MITRE ATLAS

Este modelo de ameaças é baseado em [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), um framework projetado especificamente para ameaças de IA/ML, como prompt injection, uso indevido de ferramentas e exploração de agentes. Você não precisa conhecer o ATLAS para contribuir - nós mapeamos as submissões para o framework durante a revisão.

### IDs de ameaça

Cada ameaça recebe um ID como `T-EXEC-003`. As categorias são:

| Code    | Category                                      |
| ------- | --------------------------------------------- |
| RECON   | Reconhecimento - coleta de informações        |
| ACCESS  | Acesso inicial - obtenção de entrada          |
| EXEC    | Execução - realização de ações maliciosas     |
| PERSIST | Persistência - manutenção de acesso           |
| EVADE   | Evasão de defesa - evitar detecção            |
| DISC    | Descoberta - aprender sobre o ambiente        |
| EXFIL   | Exfiltração - roubo de dados                  |
| IMPACT  | Impacto - dano ou interrupção                 |

Os IDs são atribuídos pelos mantenedores durante a revisão. Você não precisa escolher um.

### Níveis de risco

| Level        | Meaning                                                              |
| ------------ | -------------------------------------------------------------------- |
| **Critical** | Comprometimento total do sistema, ou alta probabilidade + impacto crítico |
| **High**     | Danos significativos prováveis, ou probabilidade média + impacto crítico |
| **Medium**   | Risco moderado, ou baixa probabilidade + alto impacto                |
| **Low**      | Improvável e de impacto limitado                                     |

Se você não tiver certeza sobre o nível de risco, basta descrever o impacto e nós faremos a avaliação.

## Processo de revisão

1. **Triagem** - Revisamos novas submissões em até 48 horas
2. **Avaliação** - Verificamos viabilidade, atribuímos mapeamento ATLAS e ID de ameaça, validamos o nível de risco
3. **Documentação** - Garantimos que tudo esteja formatado e completo
4. **Merge** - Adicionado ao modelo de ameaças e à visualização

## Recursos

- [Site do ATLAS](https://atlas.mitre.org/)
- [Técnicas do ATLAS](https://atlas.mitre.org/techniques/)
- [Estudos de caso do ATLAS](https://atlas.mitre.org/studies/)
- [Modelo de ameaças do OpenClaw](/pt-BR/security/THREAT-MODEL-ATLAS)

## Contato

- **Vulnerabilidades de segurança:** consulte nossa [página Trust](https://trust.openclaw.ai) para instruções de relato
- **Dúvidas sobre o modelo de ameaças:** abra uma issue em [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Chat geral:** canal #security no Discord

## Reconhecimento

Contribuidores do modelo de ameaças são reconhecidos nos agradecimentos do modelo de ameaças, nas notas de versão e no hall da fama de segurança do OpenClaw por contribuições significativas.

## Relacionado

- [Modelo de ameaças](/pt-BR/security/THREAT-MODEL-ATLAS)
- [Verificação formal](/pt-BR/security/formal-verification)
