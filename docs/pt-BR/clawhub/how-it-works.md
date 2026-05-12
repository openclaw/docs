---
read_when:
    - Entendendo listagens, versões, instalações, publicação e moderação
summary: Como funcionam as listagens, versões, instalações, publicação, verificações e atualizações do ClawHub.
x-i18n:
    generated_at: "2026-05-12T23:28:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Como o ClawHub funciona

ClawHub é a camada de registro para Skills e plugins do OpenClaw. Ele dá aos usuários um
lugar para descobrir pacotes, dá aos publicadores um lugar para lançar versões e
dá ao OpenClaw metadados suficientes para instalar e atualizar esses pacotes com segurança.

## Registros do registro

Cada listagem pública é um registro do registro com:

- um proprietário e slug ou nome do pacote
- uma ou mais versões publicadas
- metadados, resumo, arquivos e atribuição da fonte
- changelog e informações de tags, como `latest`
- sinais de download, instalação, estrela e comentário
- status de varredura de segurança e moderação

A página de listagem é o local canônico para os usuários inspecionarem o que uma skill ou
plugin afirma fazer antes de instalá-lo.

## Skills

Uma skill é um pacote de texto versionado centrado em `SKILL.md`. Ela pode incluir
arquivos de apoio, exemplos, modelos e scripts.

ClawHub lê o frontmatter de `SKILL.md` para entender o nome da skill,
a descrição, os requisitos, as variáveis de ambiente e os metadados. Metadados
precisos são importantes porque ajudam os usuários a decidir se devem instalar a skill e
ajudam varreduras automatizadas a detectar incompatibilidades entre o comportamento declarado e o observado.

Consulte [Formato de skill](/pt-BR/clawhub/skill-format).

## Plugins

Plugins são extensões empacotadas do OpenClaw. ClawHub armazena metadados do pacote,
informações de compatibilidade, links de fonte, artefatos e registros de versão.

Quando o OpenClaw instala um plugin do ClawHub, ele verifica os metadados de
compatibilidade anunciados antes de instalar. Registros de pacote podem incluir compatibilidade de API,
versão mínima do gateway, destinos de host, requisitos de ambiente e resumos
de artefatos.

Use uma fonte de instalação explícita do ClawHub quando quiser que o registro seja a
fonte da verdade:

```bash
openclaw plugins install clawhub:<package>
```

## Publicação

Publicar cria um novo registro de versão imutável. Publicadores usam a CLI `clawhub`
para fluxos de trabalho autenticados do registro:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use execuções de teste para pré-visualizar a carga útil resolvida antes do upload. As páginas públicas então
exibem os metadados publicados, arquivos, atribuição da fonte e status da varredura.

## Instalações e atualizações

Os comandos de instalação do OpenClaw usam o ClawHub como fonte de pacotes:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

O OpenClaw registra metadados da fonte de instalação para que atualizações possam resolver o mesmo
pacote do registro posteriormente. A CLI do ClawHub também oferece suporte a fluxos de trabalho diretos de instalação e
atualização de skills para usuários que desejam pastas de skills gerenciadas pelo registro fora de um
workspace completo do OpenClaw.

## Estado de segurança

ClawHub é aberto à publicação, mas os lançamentos ainda estão sujeitos a portões de upload,
verificações automatizadas, denúncias de usuários e ações de moderadores.

Páginas públicas mostram resumos de varredura quando disponíveis. Conteúdo retido, oculto
ou bloqueado pode desaparecer da pesquisa pública e dos fluxos de instalação, permanecendo
visível ao proprietário para diagnóstico.

Consulte [Segurança + moderação](/pt-BR/clawhub/security) e
[Uso aceitável](/pt-BR/clawhub/acceptable-usage).

## Acesso à API

ClawHub expõe APIs públicas de leitura para descoberta, pesquisa, detalhes de pacotes e
downloads. Catálogos de terceiros podem usar essas APIs quando vincularem de volta à
listagem canônica do ClawHub, respeitarem limites de taxa e evitarem sugerir endosso.

Consulte [API pública](/pt-BR/clawhub/api) e [API HTTP](/pt-BR/clawhub/http-api).
