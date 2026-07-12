---
read_when:
    - Você quer contribuir com descobertas de segurança ou cenários de ameaça
    - Revisão ou atualização do modelo de ameaças
summary: Como contribuir para o modelo de ameaças do OpenClaw
title: Contribuindo para o modelo de ameaças
x-i18n:
    generated_at: "2026-07-12T00:23:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

O [modelo de ameaças](/pt-BR/security/THREAT-MODEL-ATLAS) é um documento em constante evolução. Contribuições de qualquer pessoa são bem-vindas; não é necessário ter experiência em segurança ou no MITRE ATLAS.

<Note>
Esta seção destina-se a adições ao modelo de ameaças, não à comunicação de vulnerabilidades ativas. Se você encontrou uma vulnerabilidade explorável, siga as instruções de divulgação responsável na [página de confiança](https://trust.openclaw.ai).
</Note>

## Formas de contribuir

**Adicione uma ameaça.** Abra uma issue em [openclaw/trust](https://github.com/openclaw/trust/issues) descrevendo o cenário de ataque com suas próprias palavras. Informações úteis, mas não obrigatórias:

- O cenário de ataque e como ele poderia ser explorado.
- Quais componentes são afetados (CLI, Gateway, canais, ClawHub, servidores MCP etc.).
- Sua estimativa de gravidade (baixa / média / alta / crítica).
- Links para pesquisas relacionadas, CVEs ou exemplos reais.

Os mantenedores atribuem o mapeamento do ATLAS, o ID da ameaça e o nível de risco durante a revisão.

**Sugira uma mitigação.** Abra uma issue ou um PR mencionando a ameaça. Seja específico e proponha uma ação concreta: "limitação de taxa por remetente de 10 mensagens/minuto no Gateway" é mais útil do que "implementar limitação de taxa".

**Proponha uma cadeia de ataques.** As cadeias de ataques mostram como várias ameaças se combinam em um cenário realista. Descreva as etapas e como um invasor as encadearia; uma narrativa curta é melhor do que um modelo formal.

**Corrija ou melhore o conteúdo existente.** Erros de digitação, esclarecimentos, informações desatualizadas e exemplos melhores: PRs são bem-vindos, sem necessidade de abrir uma issue.

## Referência do framework

As ameaças são mapeadas para o [MITRE ATLAS](https://atlas.mitre.org/) (Cenário de Ameaças Adversárias para Sistemas de IA), um framework para ameaças específicas de IA/ML, como injeção de prompt, uso indevido de ferramentas e exploração de agentes. Você não precisa conhecer o ATLAS para contribuir; os mantenedores mapeiam os envios durante a revisão.

**IDs de ameaças.** Cada ameaça recebe um ID como `T-EXEC-003`, atribuído pelos mantenedores durante a revisão.

| Código  | Categoria                                      |
| ------- | ---------------------------------------------- |
| RECON   | Reconhecimento — coleta de informações         |
| ACCESS  | Acesso inicial — obtenção de entrada            |
| EXEC    | Execução — realização de ações maliciosas       |
| PERSIST | Persistência — manutenção do acesso             |
| EVADE   | Evasão de defesas — evitar a detecção           |
| DISC    | Descoberta — obtenção de informações do ambiente |
| EXFIL   | Exfiltração — roubo de dados                    |
| IMPACT  | Impacto — danos ou interrupções                 |

**Níveis de risco.** Se você não tiver certeza sobre o nível, apenas descreva o impacto; os mantenedores farão a avaliação.

| Nível       | Significado                                                              |
| ----------- | ------------------------------------------------------------------------ |
| **Crítico** | Comprometimento total do sistema ou alta probabilidade + impacto crítico |
| **Alto**    | Danos significativos prováveis ou probabilidade média + impacto crítico  |
| **Médio**   | Risco moderado ou baixa probabilidade + alto impacto                     |
| **Baixo**   | Improvável e com impacto limitado                                        |

## Processo de revisão

1. **Triagem** — novos envios são revisados em até 48 horas.
2. **Avaliação** — os mantenedores verificam a viabilidade, atribuem o mapeamento do ATLAS e o ID da ameaça e validam o nível de risco.
3. **Documentação** — revisão de formatação e integridade.
4. **Mesclagem** — adição ao modelo de ameaças e à visualização.

## Recursos

- [Site do ATLAS](https://atlas.mitre.org/)
- [Técnicas do ATLAS](https://atlas.mitre.org/techniques/)
- [Estudos de caso do ATLAS](https://atlas.mitre.org/studies/)

## Contato

- **Vulnerabilidades de segurança:** consulte a [página de confiança](https://trust.openclaw.ai) para obter instruções de comunicação ou envie um e-mail para `security@openclaw.ai`.
- **Dúvidas sobre o modelo de ameaças:** abra uma issue em [openclaw/trust](https://github.com/openclaw/trust/issues).
- **Conversa geral:** canal `#security` no Discord.

## Reconhecimento

Os colaboradores do modelo de ameaças recebem reconhecimento nos agradecimentos do modelo de ameaças, nas notas de versão e no hall da fama de segurança do OpenClaw por contribuições significativas.

## Relacionados

- [Modelo de ameaças](/pt-BR/security/THREAT-MODEL-ATLAS)
- [Resposta a incidentes](/pt-BR/security/incident-response)
- [Verificação formal](/pt-BR/security/formal-verification)
