---
read_when:
    - Você quer contribuir com achados de segurança ou cenários de ameaça
    - Revisando ou atualizando o modelo de ameaças
summary: Como contribuir para o modelo de ameaças do OpenClaw
title: Contribuindo para o modelo de ameaças
x-i18n:
    generated_at: "2026-04-30T10:08:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75cf2b408a78fce5134d24a3f115490da2dacc4ba8a1a24415425c3e4420ca55
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

# Contribuindo para o Modelo de Ameaças do OpenClaw

Obrigado por ajudar a tornar o OpenClaw mais seguro. Este modelo de ameaças é um documento vivo, e contribuições de qualquer pessoa são bem-vindas - você não precisa ser especialista em segurança.

## Formas de Contribuir

### Adicionar uma Ameaça

Encontrou um vetor de ataque ou risco que ainda não cobrimos? Abra uma issue em [openclaw/trust](https://github.com/openclaw/trust/issues) e descreva com suas próprias palavras. Você não precisa conhecer nenhum framework nem preencher todos os campos - basta descrever o cenário.

**Útil incluir (mas não obrigatório):**

- O cenário de ataque e como ele poderia ser explorado
- Quais partes do OpenClaw são afetadas (CLI, Gateway, canais, ClawHub, servidores MCP etc.)
- Quão grave você acha que é (baixa / média / alta / crítica)
- Quaisquer links para pesquisas relacionadas, CVEs ou exemplos reais

Cuidaremos do mapeamento ATLAS, dos IDs de ameaças e da avaliação de risco durante a revisão. Se você quiser incluir esses detalhes, ótimo - mas isso não é esperado.

> **Isto é para adicionar ao modelo de ameaças, não para relatar vulnerabilidades ativas.** Se você encontrou uma vulnerabilidade explorável, consulte nossa [página de Confiança](https://trust.openclaw.ai) para instruções de divulgação responsável.

### Sugerir uma Mitigação

Tem uma ideia de como tratar uma ameaça existente? Abra uma issue ou PR fazendo referência à ameaça. Mitigações úteis são específicas e acionáveis - por exemplo, "limitação de taxa por remetente de 10 mensagens/minuto no Gateway" é melhor do que "implementar limitação de taxa."

### Propor uma Cadeia de Ataque

Cadeias de ataque mostram como várias ameaças se combinam em um cenário de ataque realista. Se você perceber uma combinação perigosa, descreva as etapas e como um invasor as encadearia. Uma narrativa curta de como o ataque se desenrola na prática é mais valiosa do que um modelo formal.

### Corrigir ou Melhorar o Conteúdo Existente

Erros de digitação, esclarecimentos, informações desatualizadas, exemplos melhores - PRs são bem-vindos, sem necessidade de issue.

## O que usamos

### MITRE ATLAS

Este modelo de ameaças é baseado no [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), um framework projetado especificamente para ameaças de IA/ML, como injeção de prompt, uso indevido de ferramentas e exploração de agentes. Você não precisa conhecer o ATLAS para contribuir - mapeamos as contribuições para o framework durante a revisão.

### IDs de ameaças

Cada ameaça recebe um ID como `T-EXEC-003`. As categorias são:

| Código  | Categoria                                  |
| ------- | ------------------------------------------ |
| RECON   | Reconhecimento - coleta de informações     |
| ACCESS  | Acesso inicial - obtenção de entrada       |
| EXEC    | Execução - execução de ações maliciosas    |
| PERSIST | Persistência - manutenção do acesso        |
| EVADE   | Evasão de defesas - evitar detecção        |
| DISC    | Descoberta - conhecimento sobre o ambiente |
| EXFIL   | Exfiltração - roubo de dados               |
| IMPACT  | Impacto - dano ou interrupção              |

Os IDs são atribuídos pelos mantenedores durante a revisão. Você não precisa escolher um.

### Níveis de risco

| Nível        | Significado                                                       |
| ------------ | ----------------------------------------------------------------- |
| **Crítico**  | Comprometimento total do sistema, ou alta probabilidade + impacto crítico |
| **Alto**     | Dano significativo provável, ou probabilidade média + impacto crítico |
| **Médio**    | Risco moderado, ou baixa probabilidade + alto impacto             |
| **Baixo**    | Improvável e impacto limitado                                     |

Se você não tiver certeza sobre o nível de risco, apenas descreva o impacto e nós o avaliaremos.

## Processo de revisão

1. **Triagem** - Revisamos novas contribuições em até 48 horas
2. **Avaliação** - Verificamos a viabilidade, atribuímos o mapeamento ATLAS e o ID da ameaça, validamos o nível de risco
3. **Documentação** - Garantimos que tudo esteja formatado e completo
4. **Mesclagem** - Adicionado ao modelo de ameaças e à visualização

## Recursos

- [Site do ATLAS](https://atlas.mitre.org/)
- [Técnicas do ATLAS](https://atlas.mitre.org/techniques/)
- [Estudos de caso do ATLAS](https://atlas.mitre.org/studies/)
- [Modelo de Ameaças do OpenClaw](/pt-BR/security/THREAT-MODEL-ATLAS)

## Contato

- **Vulnerabilidades de segurança:** Consulte nossa [página de Confiança](https://trust.openclaw.ai) para instruções de relato
- **Perguntas sobre o modelo de ameaças:** Abra uma issue em [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Chat geral:** canal #security no Discord

## Reconhecimento

Contribuidores do modelo de ameaças são reconhecidos nos agradecimentos do modelo de ameaças, nas notas de versão e no hall da fama de segurança do OpenClaw por contribuições significativas.

## Relacionado

- [Modelo de ameaças](/pt-BR/security/THREAT-MODEL-ATLAS)
- [Verificação formal](/pt-BR/security/formal-verification)
