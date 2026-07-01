---
read_when:
    - Entendendo os resultados da auditoria de segurança do ClawHub
    - Decidindo se deve instalar uma skill ou um plugin
    - Explicando o status de auditoria, o nível de risco ou as constatações do ClawHub
sidebarTitle: Security Audits
summary: Como entender os resultados da auditoria de segurança do ClawHub antes de instalar uma skill ou plugin.
title: Auditorias de Segurança
x-i18n:
    generated_at: "2026-07-01T05:32:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Auditorias de Segurança

As auditorias de segurança do ClawHub ajudam você a decidir se uma skill ou Plugin é segura o suficiente para instalar. Elas mostram o que uma versão faz, que autoridade ela solicita e se algo merece atenção extra antes que possa acessar arquivos, contas, credenciais, código ou serviços externos.

As auditorias são sinais fortes de segurança, mas não garantem que uma versão esteja livre de riscos. Sempre use bom senso antes de conceder acesso sensível.

Consulte também [Segurança](/clawhub/security), [Uso aceitável](/pt-BR/clawhub/acceptable-usage) e [Moderação e segurança da conta](/clawhub/moderation).

## O que verificar antes de instalar

Antes de instalar, revise:

- o status geral da auditoria
- o nível de risco
- quaisquer descobertas listadas
- credenciais, permissões ou variáveis de ambiente necessárias
- proprietário, origem, versão, changelog, downloads, estrelas e outros sinais de confiança

Instale apenas conteúdo que você entende e confia.

## Status da auditoria

O status da auditoria informa como reagir ao resultado da auditoria:

| Status      | Significado                                                               |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Nenhum problema visível acima de baixo risco foi encontrado.              |
| `Review`    | Leia as descobertas antes de instalar. A versão ainda pode ser legítima.  |
| `Warn`      | Tenha cuidado extra. O ClawHub encontrou uma preocupação de alto impacto ou sinal de alerta. |
| `Malicious` | Não instale.                                                              |
| `Pending`   | As auditorias ainda não foram concluídas.                                 |
| `Error`     | Não foi possível concluir a auditoria.                                    |

Um `Pass` é tranquilizador, mas não substitui seu próprio julgamento. Isso é mais importante para ferramentas que podem publicar conteúdo, editar dados, executar comandos, ler arquivos ou acessar sistemas de produção.

## Nível de risco

O nível de risco descreve o raio de impacto: quanto poder a versão parece ter se você a usar conforme pretendido.

| Nível de risco | Significado                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| `Low`          | Pouca autoridade sensível ou impacto ao usuário foi encontrado.             |
| `Medium`       | A versão tem autoridade significativa, como acesso a contas ou alterações de dados. |
| `High`         | A versão tem autoridade de alto impacto, descobertas graves ou sinais maliciosos. |

Nível de risco e status da auditoria respondem a perguntas diferentes:

- O nível de risco pergunta: "Quanto poder há aqui?"
- O status da auditoria pergunta: "O que devo fazer com este resultado?"

Por exemplo, uma skill de publicação pode mostrar `Review` com risco `Medium`. Isso não significa que ela é maliciosa. Significa que a skill parece alinhada ao propósito, mas pode atuar com autoridade significativa sobre a conta.

## Descobertas

As descobertas explicam por que um resultado de auditoria foi exibido. Cada descoberta geralmente inclui:

- o que ela significa
- por que foi sinalizada
- o conteúdo relevante da skill ou do Plugin
- uma recomendação

As descobertas podem ser rotuladas como `Info`, `Low`, `Medium`, `High` ou `Critical`. Descobertas de maior gravidade contribuem mais fortemente para o nível de risco e o status da auditoria.

Descobertas de baixa confiança ficam ocultas no resumo público da auditoria para que a página permaneça focada em evidências úteis.

## O que o ClawHub verifica

O ClawHub audita artefatos de versão enviados, incluindo:

- instruções da skill ou metadados do Plugin
- variáveis de ambiente e permissões declaradas
- instruções de instalação e metadados de pacote
- arquivos incluídos e manifestos de arquivos
- metadados de compatibilidade e capacidade

A pergunta principal é coerência: o nome, o resumo, os metadados, a autoridade solicitada e o conteúdo real estão alinhados ao que os usuários razoavelmente esperariam?

Comportamento poderoso não é automaticamente ruim. Muitas ferramentas úteis precisam de credenciais, comandos locais, APIs de provedores ou instalações de pacotes. A auditoria verifica se esse poder é esperado, divulgado e proporcional.

As páginas de artefato vinculam para a auditoria completa em:

```text
/<owner>/skills/<slug>/security-audit
```

A página de auditoria combina:

1. SkillSpector
2. VirusTotal
3. Análise de risco

## VirusTotal

O ClawHub usa o VirusTotal como telemetria de malware na pilha de auditoria. O VirusTotal é um padrão confiável do setor para reputação de arquivos e verificação de malware, e nossa parceria permite que o ClawHub adicione inteligência de segurança mais ampla à revisão de skills e Plugins.

O VirusTotal é especialmente útil para artefatos maliciosos conhecidos, detecções de mecanismos e sinais de reputação que complementam a revisão sensível a agentes do ClawHub. Quando as contagens de mecanismos de fornecedores estão disponíveis, a auditoria as resume em linguagem simples, como:

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

O VirusTotal continua sendo telemetria. Ele não substitui a análise de risco do próprio ClawHub, sensível ao artefato.

## Análise de risco

A análise de risco é impulsionada internamente pelo ClawScan, o sistema de auditoria de segurança do próprio ClawHub. Ela revisa cada versão como um artefato voltado a agentes: instruções, metadados, permissões declaradas, arquivos, sinais de capacidade, sinais de verificação estática, descobertas do SkillSpector, telemetria do VirusTotal e contexto fornecido pelo publicador. Sinais de verificação estática são contexto interno para esta revisão; eles não são uma seção pública independente da auditoria nem um veredito que bloqueia a instalação.

A análise de risco usa o [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) como lente para riscos como injeção de prompt, uso indevido de ferramentas, exposição de credenciais, execução insegura, envenenamento de memória ou contexto e agência excessiva.

O ClawScan não trata uma capacidade com aparência assustadora como automaticamente maliciosa. Ele pergunta se a capacidade é divulgada, alinhada ao propósito e apoiada pelo caso de uso declarado da versão.
