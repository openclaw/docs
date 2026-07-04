---
read_when:
    - Entendendo os resultados da auditoria de segurança do ClawHub
    - Decidindo se deve instalar uma skill ou Plugin
    - Explicando o status de auditoria, o nível de risco ou as constatações do ClawHub
sidebarTitle: Security Audits
summary: Como entender os resultados da auditoria de segurança do ClawHub antes de instalar uma skill ou Plugin.
title: Auditorias de segurança
x-i18n:
    generated_at: "2026-07-04T17:53:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Auditorias de Segurança

As auditorias de segurança do ClawHub ajudam você a decidir se uma habilidade ou plugin é seguro o suficiente para instalar. Elas mostram o que um lançamento faz, qual autoridade ele solicita e se algo merece atenção extra antes que possa acessar arquivos, contas, credenciais, código ou serviços externos.

Auditorias são sinais de segurança fortes, mas não garantem que um lançamento seja livre de riscos. Sempre use seu julgamento antes de conceder acesso sensível.

Veja também [Segurança](/clawhub/security), [Uso aceitável](/clawhub/acceptable-usage) e [Moderação e segurança da conta](/clawhub/moderation).

## O que verificar antes de instalar

Antes de instalar, revise:

- o status geral da auditoria
- o nível de risco
- quaisquer achados listados
- credenciais, permissões ou variáveis de ambiente exigidas
- proprietário, origem, versão, changelog, downloads, estrelas e outros sinais de confiança

Instale apenas conteúdo que você entende e confia.

## Status da auditoria

O status da auditoria informa como reagir ao resultado da auditoria:

| Status      | Significado                                                               |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Nenhum problema visível acima de baixo risco foi encontrado.              |
| `Review`    | Leia os achados antes de instalar. O lançamento ainda pode ser legítimo.  |
| `Warn`      | Use cautela extra. O ClawHub encontrou uma preocupação de alto impacto ou sinal de alerta. |
| `Malicious` | Não instale.                                                              |
| `Pending`   | As auditorias ainda não foram concluídas.                                 |
| `Error`     | Não foi possível concluir a auditoria.                                    |

Um `Pass` é tranquilizador, mas não substitui seu próprio julgamento. Isso é mais importante para ferramentas que podem publicar conteúdo, editar dados, executar comandos, ler arquivos ou acessar sistemas de produção.

## Nível de risco

O nível de risco descreve o raio de impacto: quanto poder o lançamento parece ter se você o usar conforme pretendido.

| Nível de risco | Significado                                                              |
| -------------- | ------------------------------------------------------------------------ |
| `Low`          | Pouca autoridade sensível ou impacto para o usuário foi encontrado.      |
| `Medium`       | O lançamento tem autoridade significativa, como acesso a contas ou alterações de dados. |
| `High`         | O lançamento tem autoridade de alto impacto, achados graves ou sinais maliciosos. |

Nível de risco e status da auditoria respondem a perguntas diferentes:

- Nível de risco pergunta: "Quanto poder há aqui?"
- Status da auditoria pergunta: "O que devo fazer com este resultado?"

Por exemplo, uma habilidade de publicação pode mostrar `Review` com risco `Medium`. Isso não significa que ela seja maliciosa. Significa que a habilidade parece alinhada ao propósito, mas pode agir com autoridade significativa sobre a conta.

## Achados

Achados explicam por que um resultado de auditoria foi mostrado. Cada achado normalmente inclui:

- o que ele significa
- por que foi sinalizado
- o conteúdo relevante da habilidade ou plugin
- uma recomendação

Achados podem ser rotulados como `Info`, `Low`, `Medium`, `High` ou `Critical`. Achados de maior severidade contribuem mais fortemente para o nível de risco e o status da auditoria.

Achados de baixa confiança são ocultados do resumo público da auditoria para que a página permaneça focada em evidências úteis.

## O que o ClawHub verifica

O ClawHub audita artefatos de lançamento enviados, incluindo:

- instruções da habilidade ou metadados do plugin
- variáveis de ambiente e permissões declaradas
- instruções de instalação e metadados do pacote
- arquivos incluídos e manifestos de arquivos
- metadados de compatibilidade e capacidade

A pergunta principal é coerência: o nome, o resumo, os metadados, a autoridade solicitada e o conteúdo real correspondem ao que os usuários razoavelmente esperariam?

Comportamento poderoso não é automaticamente ruim. Muitas ferramentas úteis precisam de credenciais, comandos locais, APIs de provedores ou instalações de pacotes. A auditoria verifica se esse poder é esperado, divulgado e proporcional.

As páginas de artefatos vinculam à auditoria completa em:

```text
/<owner>/skills/<slug>/security-audit
```

A página da auditoria combina:

1. SkillSpector
2. VirusTotal
3. análise de risco

## VirusTotal

O ClawHub usa o VirusTotal como telemetria de malware na pilha de auditoria. O VirusTotal é um padrão confiável do setor para reputação de arquivos e varredura de malware, e nossa parceria permite que o ClawHub adicione inteligência de segurança mais ampla à revisão de habilidades e plugins.

O VirusTotal é especialmente útil para artefatos maliciosos conhecidos, detecções por mecanismos e sinais de reputação que complementam a revisão ciente de agentes do ClawHub. Quando contagens de mecanismos de fornecedores estão disponíveis, a auditoria as resume em linguagem simples, como:

```text
62/62 vendors flagged this skill as clean.
```

ou:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Quando o ClawHub não tem telemetria de contagem de fornecedores para resumir, a auditoria diz:

```text
No VirusTotal findings
```

O VirusTotal continua sendo telemetria. Ele não substitui a análise de risco própria do ClawHub, ciente de artefatos.

## Análise de risco

A análise de risco é alimentada internamente pelo ClawScan, o sistema próprio de auditoria de segurança do ClawHub. Ela revisa cada lançamento como um artefato voltado a agentes: instruções, metadados, permissões declaradas, arquivos, sinais de capacidade, sinais de varredura estática, achados do SkillSpector, telemetria do VirusTotal e contexto fornecido pelo publicador. Sinais de varredura estática são contexto interno para essa revisão; eles não são uma seção pública independente da auditoria nem um veredito que bloqueia a instalação.

A análise de risco usa o [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) como lente para riscos como injeção de prompt, uso indevido de ferramentas, exposição de credenciais, execução insegura, envenenamento de memória ou contexto e agência excessiva.

O ClawScan não trata uma capacidade de aparência assustadora como automaticamente maliciosa. Ele pergunta se a capacidade é divulgada, alinhada ao propósito e sustentada pelo caso de uso declarado do lançamento.
