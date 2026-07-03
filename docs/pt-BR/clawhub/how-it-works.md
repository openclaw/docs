---
read_when:
    - Entendendo listagens, versões, instalações, publicação e moderação
summary: Como as listagens, versões, instalações, publicações, verificações e atualizações do ClawHub funcionam.
x-i18n:
    generated_at: "2026-07-03T23:28:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Como o ClawHub Funciona

ClawHub é a camada de registro para Skills e plugins do OpenClaw. Ele oferece aos usuários um
lugar para descobrir pacotes, aos publicadores um lugar para lançar versões e
ao OpenClaw metadados suficientes para instalar e atualizar esses pacotes com segurança.

## Registros do registro

Cada listagem pública é um registro do registro com:

- um proprietário e slug ou nome de pacote
- uma ou mais versões publicadas
- metadados, resumo, arquivos e atribuição de origem
- changelog e informações de tag, como `latest`
- sinais de download, instalação e estrela
- status de varredura de segurança e moderação

A página de listagem é o local canônico para os usuários inspecionarem o que uma skill ou
plugin afirma fazer antes de instalá-lo.

## Skills

Uma skill é um pacote de texto versionado centrado em `SKILL.md`. Ele pode incluir
arquivos de suporte, exemplos, templates e scripts.

ClawHub lê o frontmatter de `SKILL.md` para entender o nome,
a descrição, os requisitos, as variáveis de ambiente e os metadados da skill. Metadados precisos
são importantes porque ajudam os usuários a decidir se devem instalar a skill e
ajudam varreduras automatizadas a detectar incompatibilidades entre o comportamento declarado e observado.

Consulte [Formato de skill](/pt-BR/clawhub/skill-format).

## Plugins

Plugins são extensões OpenClaw empacotadas. ClawHub armazena metadados de pacote,
informações de compatibilidade, links de origem, artefatos e registros de versão.

Quando o OpenClaw instala um plugin a partir do ClawHub, ele verifica os metadados de compatibilidade
anunciados antes de instalar. Registros de pacote podem incluir compatibilidade de API,
versão mínima do Gateway, alvos de host, requisitos de ambiente e hashes de artefatos.

Use uma origem de instalação explícita do ClawHub quando quiser que o registro seja a
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

Use simulações para pré-visualizar a carga resolvida antes do upload. As páginas públicas então
exibem os metadados publicados, arquivos, atribuição de origem e status da varredura.

## Instalações e atualizações

Comandos de instalação do OpenClaw usam ClawHub como fonte de pacotes:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registra metadados da origem de instalação para que atualizações possam resolver o mesmo
pacote do registro posteriormente. A CLI ClawHub também oferece suporte a fluxos diretos de instalação e
atualização de skills para usuários que querem pastas de skills gerenciadas pelo registro fora de um
workspace completo do OpenClaw.

## Estado de segurança

ClawHub é aberto para publicação, mas os lançamentos ainda estão sujeitos a gates de upload,
verificações automatizadas, relatos de usuários e ações de moderadores.

Páginas públicas mostram resumos de varredura quando disponíveis. Conteúdo retido, oculto
ou bloqueado pode desaparecer da busca pública e dos fluxos de instalação, enquanto permanece
visível para o proprietário para diagnósticos.

Consulte [Segurança](/clawhub/security), [Auditorias de Segurança](/clawhub/security-audits),
[Moderação e Segurança da Conta](/pt-BR/clawhub/moderation) e
[Uso aceitável](/clawhub/acceptable-usage).

## Acesso à API

ClawHub expõe APIs públicas de leitura para descoberta, busca, detalhes de pacote e
downloads. Catálogos de terceiros podem usar essas APIs quando vincularem de volta à
listagem canônica do ClawHub, respeitarem limites de taxa e evitarem implicar endosso.

Consulte [API Pública](/pt-BR/clawhub/api) e [API HTTP](/clawhub/http-api).
