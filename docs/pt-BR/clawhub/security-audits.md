---
read_when:
    - Como entender os resultados da auditoria de segurança do ClawHub
    - Decidindo entre instalar uma Skill ou um Plugin
    - Explicação do status da auditoria, do nível de risco ou das constatações do ClawHub
sidebarTitle: Security Audits
summary: Como interpretar os resultados da auditoria de segurança do ClawHub antes de instalar uma skill ou um plugin.
title: Auditorias de segurança
x-i18n:
    generated_at: "2026-07-11T23:49:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Auditorias de segurança

As auditorias de segurança do ClawHub ajudam você a decidir se uma Skill ou um Plugin é seguro o suficiente
para instalar. Elas mostram o que uma versão faz, quais autorizações ela solicita e
se algo merece atenção adicional antes que possa acessar arquivos, contas,
credenciais, código ou serviços externos.

As auditorias são fortes indicadores de segurança, mas não garantem que uma versão seja
isenta de riscos. Sempre use seu discernimento antes de conceder acesso sensível.

Consulte também [Segurança](/clawhub/security), [Uso aceitável](/clawhub/acceptable-usage)
e [Moderação e segurança da conta](/clawhub/moderation).

## O que verificar antes de instalar

Antes de instalar, analise:

- o status geral da auditoria
- o nível de risco
- todas as constatações listadas
- as credenciais, permissões ou variáveis de ambiente necessárias
- o proprietário, a origem, a versão, o changelog, os downloads, as estrelas e outros indicadores de confiança

Instale somente conteúdo que você compreenda e no qual confie.

## Status da auditoria

O status da auditoria indica como você deve reagir ao resultado:

| Status      | Significado                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Nenhum problema visível acima do nível de risco baixo foi encontrado.                                |
| `Review`    | Leia as constatações antes de instalar. A versão ainda pode ser legítima. |
| `Warn`      | Tenha cuidado adicional. O ClawHub encontrou uma preocupação de alto impacto ou um sinal de alerta. |
| `Malicious` | Não instale.                                                           |
| `Pending`   | As auditorias ainda não foram concluídas.                                             |
| `Error`     | Não foi possível concluir a auditoria.                                         |

Um resultado `Pass` é tranquilizador, mas não substitui seu próprio discernimento. Isso é mais importante
para ferramentas que podem publicar conteúdo, editar dados, executar comandos, ler arquivos ou
acessar sistemas de produção.

## Nível de risco

O nível de risco descreve o raio de impacto: quanto poder a versão parece ter se
você a usar conforme o esperado.

| Nível de risco | Significado                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Pouca autoridade sensível ou pouco impacto para o usuário foi identificado.                          |
| `Medium`   | A versão tem autoridade significativa, como acesso a contas ou alterações de dados. |
| `High`     | A versão tem autoridade de alto impacto, constatações graves ou sinais maliciosos. |

O nível de risco e o status da auditoria respondem a perguntas diferentes:

- O nível de risco pergunta: "Quanto poder existe aqui?"
- O status da auditoria pergunta: "O que devo fazer com este resultado?"

Por exemplo, uma Skill de publicação pode exibir `Review` com risco `Medium`. Isso
não significa que ela seja maliciosa. Significa que a Skill parece estar alinhada ao seu propósito, mas pode
agir com autoridade significativa sobre a conta.

## Constatações

As constatações explicam por que um resultado de auditoria foi exibido. Cada constatação geralmente inclui:

- o que ela significa
- por que foi sinalizada
- o conteúdo relevante da Skill ou do Plugin
- uma recomendação

As constatações podem ser classificadas como `Info`, `Low`, `Medium`, `High` ou `Critical`. Constatações de
maior gravidade contribuem mais para o nível de risco e o status da auditoria.

Constatações de baixa confiança são ocultadas do resumo público da auditoria para que a página
permaneça focada em evidências úteis.

## O que o ClawHub verifica

O ClawHub audita os artefatos de versão enviados, incluindo:

- instruções da Skill ou metadados do Plugin
- variáveis de ambiente e permissões declaradas
- instruções de instalação e metadados do pacote
- arquivos incluídos e manifestos de arquivos
- metadados de compatibilidade e recursos

A principal questão é a coerência: o nome, o resumo, os metadados, a
autoridade solicitada e o conteúdo real correspondem ao que os usuários poderiam razoavelmente esperar?

Um comportamento poderoso não é automaticamente ruim. Muitas ferramentas úteis precisam de credenciais,
comandos locais, APIs de provedores ou instalações de pacotes. A auditoria verifica se esse
poder é esperado, divulgado e proporcional.

As páginas de artefatos fornecem um link para a auditoria completa em:

```text
/<owner>/skills/<slug>/security-audit
```

A página da auditoria combina:

1. SkillSpector
2. VirusTotal
3. Análise de risco

## VirusTotal

O ClawHub usa o VirusTotal como telemetria de malware na pilha de auditoria. O VirusTotal é um
padrão confiável do setor para reputação de arquivos e verificação de malware, e nossa
parceria permite que o ClawHub adicione inteligência de segurança mais ampla à análise de Skills e Plugins.

O VirusTotal é especialmente útil para artefatos maliciosos conhecidos, detecções de mecanismos e
indicadores de reputação que complementam a análise do ClawHub voltada para agentes. Quando as
contagens dos mecanismos dos fornecedores estão disponíveis, a auditoria as resume em linguagem simples, por
exemplo:

```text
62/62 fornecedores classificaram esta Skill como segura.
```

ou:

```text
2/64 fornecedores classificaram esta Skill como maliciosa, 1/64 a classificou como suspeita e 61/64 a classificaram como segura.
```

Quando o ClawHub não dispõe de telemetria de contagem de fornecedores para resumir, a auditoria informa:

```text
Nenhuma constatação do VirusTotal
```

O VirusTotal continua sendo uma fonte de telemetria. Ele não substitui a análise de risco do próprio ClawHub,
que considera os artefatos.

## Análise de risco

A análise de risco é executada internamente pelo ClawScan, o sistema próprio de auditoria de segurança
do ClawHub. Ele analisa cada versão como um artefato voltado para agentes: instruções,
metadados, permissões declaradas, arquivos, indicadores de recursos, indicadores de análise estática,
constatações do SkillSpector, telemetria do VirusTotal e contexto fornecido pelo publicador.
Os indicadores de análise estática são um contexto interno para essa análise; eles não constituem uma
seção pública independente da auditoria nem um veredito que bloqueia a instalação.

A análise de risco usa o
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
como referência para riscos como injeção de prompts, uso indevido de ferramentas, exposição de credenciais,
execução insegura, envenenamento de memória ou contexto e autonomia excessiva.

O ClawScan não considera um recurso aparentemente perigoso como automaticamente malicioso.
Ele avalia se o recurso foi divulgado, está alinhado ao propósito e é sustentado pelo
caso de uso declarado da versão.
