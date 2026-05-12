---
read_when:
    - Entendendo listagens, versões, instalações, publicação e moderação
summary: Como funcionam as listagens, versões, instalações, publicações, varreduras e atualizações do ClawHub.
x-i18n:
    generated_at: "2026-05-12T04:09:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Como o ClawHub funciona

ClawHub é a camada de registro para Skills e plugins do OpenClaw. Ele oferece aos usuários um
lugar para descobrir pacotes, aos publicadores um lugar para lançar versões, e
ao OpenClaw metadados suficientes para instalar e atualizar esses pacotes com segurança.

## Registros do registro

Cada listagem pública é um registro do registro com:

- um proprietário e slug ou nome de pacote
- uma ou mais versões publicadas
- metadados, resumo, arquivos e atribuição de origem
- changelog e informações de tag, como `latest`
- sinais de download, instalação, estrela e comentário
- status de varredura de segurança e moderação

A página de listagem é o local canônico para os usuários inspecionarem o que uma skill ou
plugin afirma fazer antes de instalá-lo.

## Skills

Uma skill é um pacote de texto versionado centrado em `SKILL.md`. Ela pode incluir
arquivos de apoio, exemplos, modelos e scripts.

O ClawHub lê o frontmatter de `SKILL.md` para entender o nome da skill,
descrição, requisitos, variáveis de ambiente e metadados. Metadados precisos
são importantes porque ajudam os usuários a decidir se devem instalar a skill e
ajudam varreduras automatizadas a detectar incompatibilidades entre o comportamento declarado e o observado.

Consulte [Formato de skill](/pt-BR/clawhub/skill-format).

## Plugins

Plugins são extensões empacotadas do OpenClaw. O ClawHub armazena metadados de pacote,
informações de compatibilidade, links de origem, artefatos e registros de versão.

Quando o OpenClaw instala um plugin do ClawHub, ele verifica os metadados de compatibilidade
anunciados antes de instalar. Registros de pacote podem incluir compatibilidade de API,
versão mínima do Gateway, destinos de host, requisitos de ambiente e resumos criptográficos
de artefatos.

Use uma origem de instalação explícita do ClawHub quando quiser que o registro seja a
fonte da verdade:

```bash
openclaw plugins install clawhub:<package>
```

## Publicação

A publicação cria um novo registro de versão imutável. Publicadores usam a CLI `clawhub`
para fluxos de trabalho autenticados do registro:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use execuções de simulação para pré-visualizar a carga resolvida antes do envio. As páginas públicas então
exibem os metadados publicados, arquivos, atribuição de origem e status de varredura.

## Instalações e atualizações

Os comandos de instalação do OpenClaw usam o ClawHub como origem de pacote:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

O OpenClaw registra metadados da origem de instalação para que atualizações possam resolver o mesmo
pacote do registro posteriormente. A CLI do ClawHub também oferece suporte a fluxos de trabalho diretos de instalação e
atualização de skills para usuários que querem pastas de skills gerenciadas pelo registro fora de um
workspace completo do OpenClaw.

## Estado de segurança

O ClawHub é aberto à publicação, mas os lançamentos ainda estão sujeitos a bloqueios de envio,
verificações automatizadas, relatos de usuários e ação de moderadores.

As páginas públicas mostram resumos de varredura quando disponíveis. Conteúdo que é retido, ocultado
ou bloqueado pode desaparecer da busca pública e dos fluxos de instalação, enquanto permanece
visível para o proprietário para diagnóstico.

Consulte [Segurança + moderação](/pt-BR/clawhub/security) e
[Uso aceitável](/pt-BR/clawhub/acceptable-usage).

## Acesso à API

O ClawHub expõe APIs públicas de leitura para descoberta, busca, detalhes de pacotes e
downloads. Catálogos de terceiros podem usar essas APIs quando vincularem de volta à
listagem canônica do ClawHub, respeitarem limites de taxa e evitarem sugerir endosso.

Consulte [API pública](/pt-BR/clawhub/api) e [API HTTP](/pt-BR/clawhub/http-api).
