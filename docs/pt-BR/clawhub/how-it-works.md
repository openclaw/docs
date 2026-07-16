---
read_when:
    - Como entender listagens, versões, instalações, publicação e moderação
summary: Como funcionam as listagens, versões, instalações, publicações, verificações e atualizações do ClawHub.
x-i18n:
    generated_at: "2026-07-16T12:16:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Como o ClawHub funciona

O ClawHub é a camada de registro para Skills e plugins do OpenClaw. Ele oferece aos usuários um
lugar para descobrir pacotes, aos publicadores um lugar para lançar versões e
fornece ao OpenClaw metadados suficientes para instalar e atualizar esses pacotes com segurança.

## Registros do catálogo

Cada listagem pública é um registro do catálogo com:

- um proprietário e um slug ou nome de pacote
- uma ou mais versões publicadas
- metadados, resumo, arquivos e atribuição da fonte
- informações do changelog e de tags, como `latest`
- indicadores de downloads, instalações e estrelas
- status de verificação de segurança e moderação

A página da listagem é o local canônico para os usuários verificarem o que uma Skill ou
um plugin afirma fazer antes da instalação.

## Skills

Uma Skill é um pacote de texto versionado centrado em `SKILL.md`. Ela pode incluir
arquivos de apoio, exemplos, modelos e scripts.

O ClawHub lê o frontmatter de `SKILL.md` para entender o nome,
a descrição, os requisitos, as variáveis de ambiente e os metadados da Skill. Metadados
precisos são importantes porque ajudam os usuários a decidir se devem instalar a Skill e
ajudam as verificações automatizadas a detectar divergências entre o comportamento declarado e o observado.

Consulte [Formato de Skills](/pt-BR/clawhub/skill-format).

## Plugins

Plugins são extensões empacotadas do OpenClaw. O ClawHub armazena metadados do pacote,
informações de compatibilidade, links para o código-fonte, artefatos e registros de versões.

Quando o OpenClaw instala um plugin do ClawHub, ele verifica os metadados de compatibilidade
anunciados antes da instalação. Os registros de pacotes podem incluir compatibilidade de API,
versão mínima do Gateway, plataformas de destino, requisitos de ambiente e resumos criptográficos
dos artefatos.

Use uma fonte de instalação explícita do ClawHub quando quiser que o catálogo seja a
fonte da verdade:

```bash
openclaw plugins install clawhub:<package>
```

## Publicação

A publicação cria um novo registro de versão imutável. Os publicadores usam a CLI `clawhub`
para fluxos de trabalho autenticados no catálogo:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use simulações para visualizar a carga útil resolvida antes do envio. Em seguida, as páginas públicas
exibem os metadados publicados, os arquivos, a atribuição da fonte e o status da verificação.

## Instalações e atualizações

Os comandos de instalação do OpenClaw usam o ClawHub como fonte de pacotes:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

O OpenClaw registra os metadados da fonte de instalação para que as atualizações possam resolver o mesmo
pacote do catálogo posteriormente. A CLI do ClawHub também oferece suporte a fluxos de trabalho diretos de instalação e
atualização de Skills para usuários que desejam pastas de Skills gerenciadas pelo catálogo fora de um
workspace completo do OpenClaw.

## Estado de segurança

O ClawHub é aberto à publicação, mas os lançamentos ainda estão sujeitos a controles de envio,
verificações automatizadas, denúncias de usuários e ações de moderadores.

As páginas públicas exibem resumos das verificações quando disponíveis. Conteúdos retidos, ocultos
ou bloqueados podem desaparecer da pesquisa pública e dos fluxos de instalação, mas permanecem
visíveis para o proprietário para fins de diagnóstico.

Consulte [Segurança](/clawhub/security), [Auditorias de segurança](/clawhub/security-audits),
[Moderação e segurança da conta](/pt-BR/clawhub/moderation) e
[Uso aceitável](/clawhub/acceptable-usage).

## Acesso à API

O ClawHub disponibiliza APIs públicas de leitura para descoberta, pesquisa, detalhes de pacotes e
downloads. Catálogos de terceiros podem usar essas APIs quando fornecem um link para a
listagem canônica do ClawHub, respeitam os limites de requisições e evitam sugerir endosso.

Consulte [API pública](/clawhub/api) e [API HTTP](/clawhub/http-api).
