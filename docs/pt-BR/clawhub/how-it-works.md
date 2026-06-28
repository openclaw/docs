---
read_when:
    - Entendendo listagens, versões, instalações, publicação e moderação
summary: Como listagens, versões, instalações, publicações, verificações e atualizações do ClawHub funcionam.
x-i18n:
    generated_at: "2026-06-28T05:29:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Como o ClawHub funciona

ClawHub é a camada de registro para Skills e plugins do OpenClaw. Ele oferece aos usuários um
local para descobrir pacotes, aos publicadores um local para lançar versões e
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
arquivos de suporte, exemplos, modelos e scripts.

O ClawHub lê o frontmatter de `SKILL.md` para entender o nome da skill,
descrição, requisitos, variáveis de ambiente e metadados. Metadados precisos
são importantes porque ajudam os usuários a decidir se devem instalar a skill e
ajudam varreduras automatizadas a detectar incompatibilidades entre o comportamento declarado e observado.

Consulte [Formato de skill](/pt-BR/clawhub/skill-format).

## Plugins

Plugins são extensões empacotadas do OpenClaw. O ClawHub armazena metadados de pacote,
informações de compatibilidade, links de origem, artefatos e registros de versão.

Quando o OpenClaw instala um plugin do ClawHub, ele verifica os metadados de compatibilidade
anunciados antes da instalação. Registros de pacote podem incluir compatibilidade de API,
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

Use simulações para visualizar a carga útil resolvida antes do upload. As páginas públicas então
exibem os metadados publicados, arquivos, atribuição de origem e status de varredura.

## Instalações e atualizações

Os comandos de instalação do OpenClaw usam o ClawHub como uma origem de pacote:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

O OpenClaw registra metadados da origem de instalação para que as atualizações possam resolver o mesmo
pacote do registro posteriormente. A CLI do ClawHub também oferece suporte a fluxos de trabalho diretos
de instalação e atualização de skills para usuários que desejam pastas de skills gerenciadas pelo registro fora de um
workspace completo do OpenClaw.

## Estado de segurança

O ClawHub é aberto à publicação, mas os lançamentos ainda estão sujeitos a gates de upload,
verificações automatizadas, relatórios de usuários e ação de moderadores.

Páginas públicas mostram resumos de varredura quando disponíveis. Conteúdo que está retido, oculto
ou bloqueado pode desaparecer da busca pública e dos fluxos de instalação, permanecendo
visível ao proprietário para diagnósticos.

Consulte [Segurança](/pt-BR/clawhub/security), [Auditorias de segurança](/pt-BR/clawhub/security-audits),
[Moderação e segurança da conta](/pt-BR/clawhub/moderation) e
[Uso aceitável](/pt-BR/clawhub/acceptable-usage).

## Acesso à API

O ClawHub expõe APIs públicas de leitura para descoberta, busca, detalhes de pacote e
downloads. Catálogos de terceiros podem usar essas APIs quando vinculam à listagem
canônica do ClawHub, respeitam limites de taxa e evitam sugerir endosso.

Consulte [API pública](/pt-BR/clawhub/api) e [API HTTP](/pt-BR/clawhub/http-api).
