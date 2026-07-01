---
read_when:
    - Entendendo listagens, versões, instalações, publicação e moderação
summary: Como funcionam as listagens, versões, instalações, publicações, verificações e atualizações do ClawHub.
x-i18n:
    generated_at: "2026-07-01T05:31:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Como o ClawHub funciona

ClawHub é a camada de registro para Skills e Plugins do OpenClaw. Ele oferece aos usuários um
local para descobrir pacotes, aos publicadores um local para lançar versões e
ao OpenClaw metadados suficientes para instalar e atualizar esses pacotes com segurança.

## Registros do registry

Cada listagem pública é um registro do registry com:

- um proprietário e slug ou nome de pacote
- uma ou mais versões publicadas
- metadados, resumo, arquivos e atribuição de origem
- changelog e informações de tags, como `latest`
- sinais de download, instalação e estrelas
- status de verificação de segurança e moderação

A página de listagem é o local canônico para os usuários inspecionarem o que uma Skill ou
Plugin afirma fazer antes de instalá-lo.

## Skills

Uma Skill é um pacote de texto versionado centrado em `SKILL.md`. Ela pode incluir
arquivos de suporte, exemplos, modelos e scripts.

O ClawHub lê o frontmatter de `SKILL.md` para entender o nome da Skill,
descrição, requisitos, variáveis de ambiente e metadados. Metadados precisos
são importantes porque ajudam os usuários a decidir se devem instalar a Skill e
ajudam verificações automatizadas a detectar incompatibilidades entre o comportamento declarado e o observado.

Consulte [Formato de Skill](/pt-BR/clawhub/skill-format).

## Plugins

Plugins são extensões empacotadas do OpenClaw. O ClawHub armazena metadados de pacote,
informações de compatibilidade, links de origem, artefatos e registros de versão.

Quando o OpenClaw instala um Plugin a partir do ClawHub, ele verifica os metadados
de compatibilidade anunciados antes da instalação. Registros de pacote podem incluir compatibilidade de API,
versão mínima do Gateway, alvos de host, requisitos de ambiente e resumos criptográficos de artefatos.

Use uma fonte de instalação explícita do ClawHub quando quiser que o registry seja a
fonte da verdade:

```bash
openclaw plugins install clawhub:<package>
```

## Publicação

A publicação cria um novo registro de versão imutável. Publicadores usam a CLI `clawhub`
para fluxos de trabalho autenticados do registry:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use execuções de teste para pré-visualizar a carga útil resolvida antes do upload. Páginas públicas então
exibem os metadados publicados, arquivos, atribuição de origem e status de verificação.

## Instalações e atualizações

Comandos de instalação do OpenClaw usam o ClawHub como fonte de pacote:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

O OpenClaw registra metadados da fonte de instalação para que as atualizações possam resolver o mesmo
pacote do registry posteriormente. A CLI do ClawHub também oferece suporte a fluxos de trabalho diretos de instalação e
atualização de Skills para usuários que desejam pastas de Skills gerenciadas pelo registry fora de um
workspace completo do OpenClaw.

## Estado de segurança

O ClawHub é aberto à publicação, mas os lançamentos ainda estão sujeitos a barreiras de upload,
verificações automatizadas, denúncias de usuários e ações de moderadores.

Páginas públicas mostram resumos de verificação quando disponíveis. Conteúdo retido, oculto
ou bloqueado pode desaparecer da busca pública e dos fluxos de instalação, permanecendo
visível para o proprietário para diagnósticos.

Consulte [Segurança](/clawhub/security), [Auditorias de Segurança](/clawhub/security-audits),
[Moderação e Segurança da Conta](/pt-BR/clawhub/moderation) e
[Uso aceitável](/clawhub/acceptable-usage).

## Acesso à API

O ClawHub expõe APIs públicas de leitura para descoberta, busca, detalhes de pacote e
downloads. Catálogos de terceiros podem usar essas APIs quando vinculam de volta à
listagem canônica do ClawHub, respeitam limites de taxa e evitam sugerir endosso.

Consulte [API Pública](/clawhub/api) e [API HTTP](/clawhub/http-api).
