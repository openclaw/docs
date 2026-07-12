---
read_when:
    - Entendendo listagens, versões, instalações, publicação e moderação
summary: Como funcionam as listagens, versões, instalações, publicações, verificações e atualizações do ClawHub.
x-i18n:
    generated_at: "2026-07-12T14:58:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Como o ClawHub funciona

O ClawHub é a camada de registro para Skills e plugins do OpenClaw. Ele oferece aos usuários um
local para descobrir pacotes, aos publicadores um local para lançar versões e
ao OpenClaw metadados suficientes para instalar e atualizar esses pacotes com segurança.

## Registros do registro

Cada listagem pública é um registro do registro com:

- um proprietário e um slug ou nome de pacote
- uma ou mais versões publicadas
- metadados, resumo, arquivos e atribuição da origem
- informações de changelog e tags, como `latest`
- indicadores de downloads, instalações e estrelas
- status da verificação de segurança e da moderação

A página da listagem é o local canônico para os usuários verificarem o que uma Skill ou
um plugin afirma fazer antes de instalá-lo.

## Skills

Uma Skill é um pacote de texto versionado centrado no `SKILL.md`. Ela pode incluir
arquivos de apoio, exemplos, modelos e scripts.

O ClawHub lê o frontmatter do `SKILL.md` para identificar o nome,
a descrição, os requisitos, as variáveis de ambiente e os metadados da Skill. Metadados
precisos são importantes porque ajudam os usuários a decidir se devem instalar a Skill e
ajudam as verificações automatizadas a detectar divergências entre o comportamento declarado e o observado.

Consulte [Formato de Skill](/pt-BR/clawhub/skill-format).

## Plugins

Plugins são extensões empacotadas do OpenClaw. O ClawHub armazena metadados do pacote,
informações de compatibilidade, links para o código-fonte, artefatos e registros de versões.

Quando o OpenClaw instala um plugin do ClawHub, ele verifica os metadados de
compatibilidade anunciados antes da instalação. Os registros de pacotes podem incluir compatibilidade da API,
versão mínima do Gateway, destinos de host, requisitos de ambiente e resumos
criptográficos dos artefatos.

Use uma origem de instalação explícita do ClawHub quando quiser que o registro seja a
fonte da verdade:

```bash
openclaw plugins install clawhub:<package>
```

## Publicação

A publicação cria um novo registro de versão imutável. Os publicadores usam a CLI `clawhub`
para fluxos de trabalho autenticados no registro:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use simulações para visualizar a carga útil resolvida antes do envio. Em seguida, as páginas públicas
exibem os metadados publicados, os arquivos, a atribuição da origem e o status da verificação.

## Instalações e atualizações

Os comandos de instalação do OpenClaw usam o ClawHub como origem de pacotes:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

O OpenClaw registra os metadados da origem da instalação para que as atualizações possam resolver o mesmo
pacote do registro posteriormente. A CLI do ClawHub também oferece fluxos de trabalho diretos de instalação e
atualização de Skills para usuários que desejam pastas de Skills gerenciadas pelo registro fora de um
workspace completo do OpenClaw.

## Estado de segurança

O ClawHub permite publicações abertas, mas os lançamentos ainda estão sujeitos a controles de envio,
verificações automatizadas, denúncias de usuários e ações de moderadores.

As páginas públicas exibem resumos das verificações quando disponíveis. Conteúdo retido, oculto
ou bloqueado pode desaparecer da pesquisa pública e dos fluxos de instalação, mas permanecer
visível para o proprietário para fins de diagnóstico.

Consulte [Segurança](/clawhub/security), [Auditorias de segurança](/clawhub/security-audits),
[Moderação e segurança da conta](/pt-BR/clawhub/moderation) e
[Uso aceitável](/clawhub/acceptable-usage).

## Acesso à API

O ClawHub disponibiliza APIs públicas de leitura para descoberta, pesquisa, detalhes de pacotes e
downloads. Catálogos de terceiros podem usar essas APIs desde que forneçam um link para a
listagem canônica do ClawHub, respeitem os limites de taxa e não sugiram endosso.

Consulte [API pública](/clawhub/api) e [API HTTP](/clawhub/http-api).
