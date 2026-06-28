---
read_when:
    - Entendendo os resultados da auditoria de segurança do ClawHub
    - Decidindo se deve instalar uma skill ou Plugin
    - Explicando o status de auditoria, o nível de risco ou as descobertas do ClawHub
sidebarTitle: Security Audits
summary: Como entender os resultados da auditoria de segurança do ClawHub antes de instalar uma skill ou Plugin.
title: Auditorias de Segurança
x-i18n:
    generated_at: "2026-06-28T05:07:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Auditorias de segurança

As auditorias de segurança do ClawHub ajudam você a decidir se uma habilidade ou plugin é seguro o suficiente
para instalar. Elas mostram o que uma versão faz, que autoridade ela solicita e
se algo merece atenção extra antes que possa acessar arquivos, contas,
credenciais, código ou serviços externos.

Auditorias são sinais fortes de segurança, mas não garantem que uma versão esteja
livre de riscos. Sempre use seu julgamento antes de conceder acesso sensível.

Veja também [Segurança](/pt-BR/clawhub/security), [Uso aceitável](/pt-BR/clawhub/acceptable-usage)
e [Moderação e segurança da conta](/pt-BR/clawhub/moderation).

## O que verificar antes de instalar

Antes de instalar, revise:

- o status geral da auditoria
- o nível de risco
- quaisquer achados listados
- credenciais, permissões ou variáveis de ambiente exigidas
- proprietário, origem, versão, changelog, downloads, estrelas e outros sinais de confiança

Instale apenas conteúdo que você entende e no qual confia.

## Status da auditoria

O status da auditoria informa como reagir ao resultado da auditoria:

| Status      | Significado                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Nenhum problema visível acima de baixo risco foi encontrado.                                |
| `Review`    | Leia os achados antes de instalar. A versão ainda pode ser legítima. |
| `Warn`      | Tenha cautela extra. O ClawHub encontrou uma preocupação de alto impacto ou um sinal de alerta. |
| `Malicious` | Não instale.                                                           |
| `Pending`   | As auditorias ainda não terminaram.                                             |
| `Error`     | Não foi possível concluir a auditoria.                                         |

Um `Pass` é tranquilizador, mas não substitui seu próprio julgamento. Isso importa
mais para ferramentas que podem publicar conteúdo, editar dados, executar comandos, ler arquivos ou
acessar sistemas de produção.

## Nível de risco

O nível de risco descreve o raio de impacto: quanto poder a versão parece ter se
você a usar como pretendido.

| Nível de risco | Significado                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Pouca autoridade sensível ou impacto ao usuário foi encontrado.                          |
| `Medium`   | A versão tem autoridade significativa, como acesso a contas ou alterações de dados. |
| `High`     | A versão tem autoridade de alto impacto, achados graves ou sinais maliciosos. |

O nível de risco e o status da auditoria respondem a perguntas diferentes:

- O nível de risco pergunta: "Quanto poder há aqui?"
- O status da auditoria pergunta: "O que devo fazer com este resultado?"

Por exemplo, uma habilidade de publicação pode mostrar `Review` com risco `Medium`. Isso
não significa que ela seja maliciosa. Significa que a habilidade parece alinhada ao propósito, mas pode
agir com autoridade significativa sobre a conta.

## Achados

Os achados explicam por que um resultado de auditoria foi exibido. Cada achado geralmente inclui:

- o que ele significa
- por que foi sinalizado
- o conteúdo relevante da habilidade ou do plugin
- uma recomendação

Os achados podem ser rotulados como `Info`, `Low`, `Medium`, `High` ou `Critical`. Achados de
maior gravidade contribuem mais fortemente para o nível de risco e o status da auditoria.

Achados de baixa confiança ficam ocultos do resumo público da auditoria para que a página
permaneça focada em evidências úteis.

## O que o ClawHub verifica

O ClawHub audita artefatos de versão enviados, incluindo:

- instruções de habilidades ou metadados de plugins
- variáveis de ambiente e permissões declaradas
- instruções de instalação e metadados de pacote
- arquivos incluídos e manifestos de arquivos
- metadados de compatibilidade e capacidade

A pergunta principal é coerência: o nome, o resumo, os metadados, a autoridade
solicitada e o conteúdo real correspondem ao que os usuários esperariam razoavelmente?

Comportamento poderoso não é automaticamente ruim. Muitas ferramentas úteis precisam de credenciais,
comandos locais, APIs de provedores ou instalações de pacotes. A auditoria verifica se esse
poder é esperado, divulgado e proporcional.

As páginas de artefatos vinculam para a auditoria completa em:

```text
/<owner>/skills/<slug>/security-audit
```

A página de auditoria combina:

1. SkillSpector
2. VirusTotal
3. análise de risco

## VirusTotal

O ClawHub usa o VirusTotal como telemetria de malware na pilha de auditoria. O VirusTotal é um
padrão confiável do setor para reputação de arquivos e varredura de malware, e nossa
parceria permite que o ClawHub adicione inteligência de segurança mais ampla à revisão de habilidades e plugins.

O VirusTotal é especialmente útil para artefatos maliciosos conhecidos, detecções por mecanismos e
sinais de reputação que complementam a revisão do ClawHub ciente de agentes. Quando contagens de
mecanismos de fornecedores estão disponíveis, a auditoria as resume em linguagem simples, como:

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

O VirusTotal continua sendo telemetria. Ele não substitui a análise de risco
própria do ClawHub, ciente de artefatos.

## Análise de risco

A análise de risco é alimentada internamente pelo ClawScan, o sistema próprio de auditoria de segurança
do ClawHub. Ele revisa cada versão como um artefato voltado para agentes: instruções,
metadados, permissões declaradas, arquivos, sinais de capacidade, sinais de varredura estática,
achados do SkillSpector, telemetria do VirusTotal e contexto fornecido pelo editor.
Sinais de varredura estática são contexto interno para essa revisão; eles não são uma
seção pública autônoma da auditoria nem um veredito que bloqueia a instalação.

A análise de risco usa o
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
como lente para riscos como injeção de prompt, uso indevido de ferramentas, exposição de credenciais,
execução insegura, envenenamento de memória ou contexto e autonomia excessiva.

O ClawScan não trata uma capacidade com aparência assustadora como automaticamente maliciosa.
Ele pergunta se a capacidade é divulgada, alinhada ao propósito e respaldada pelo
caso de uso declarado da versão.
