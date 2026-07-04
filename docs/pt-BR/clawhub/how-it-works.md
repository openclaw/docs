---
read_when:
    - Entendendo listagens, versões, instalações, publicação e moderação
summary: Como funcionam as listagens, versões, instalações, publicação, verificações e atualizações do ClawHub.
x-i18n:
    generated_at: "2026-07-04T10:31:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Como o ClawHub funciona

O ClawHub é a camada de registro para Skills e Plugins do OpenClaw. Ele oferece aos usuários um
lugar para descobrir pacotes, aos publicadores um lugar para lançar versões e
ao OpenClaw metadados suficientes para instalar e atualizar esses pacotes com segurança.

## Registros do registro

Cada listagem pública é um registro do registro com:

- um proprietário e slug ou nome de pacote
- uma ou mais versões publicadas
- metadados, resumo, arquivos e atribuição de origem
- changelog e informações de tag, como `latest`
- sinais de download, instalação e estrela
- status de verificação de segurança e moderação

A página da listagem é o local canônico para os usuários inspecionarem o que uma Skill ou
Plugin declara fazer antes de instalá-lo.

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

Quando o OpenClaw instala um Plugin pelo ClawHub, ele verifica os metadados de compatibilidade
anunciados antes de instalar. Registros de pacote podem incluir compatibilidade de API,
versão mínima do Gateway, destinos de host, requisitos de ambiente e resumos
criptográficos de artefatos.

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

Use execuções de simulação para visualizar a carga útil resolvida antes do envio. As páginas públicas então
exibem os metadados publicados, arquivos, atribuição de origem e status de verificação.

## Instalações e atualizações

Os comandos de instalação do OpenClaw usam o ClawHub como fonte de pacote:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

O OpenClaw registra metadados da fonte de instalação para que atualizações possam resolver o mesmo
pacote do registro posteriormente. A CLI do ClawHub também oferece suporte a fluxos diretos de instalação e
atualização de Skills para usuários que querem pastas de Skills gerenciadas pelo registro fora de um
workspace completo do OpenClaw.

## Estado de segurança

O ClawHub é aberto à publicação, mas os lançamentos ainda estão sujeitos a barreiras de upload,
verificações automatizadas, relatos de usuários e ações de moderadores.

As páginas públicas mostram resumos de verificação quando disponíveis. Conteúdo retido, oculto
ou bloqueado pode desaparecer dos fluxos públicos de busca e instalação, permanecendo
visível para o proprietário para diagnósticos.

Consulte [Segurança](/clawhub/security), [Auditorias de segurança](/clawhub/security-audits),
[Moderação e segurança da conta](/pt-BR/clawhub/moderation) e
[Uso aceitável](/clawhub/acceptable-usage).

## Acesso à API

O ClawHub expõe APIs públicas de leitura para descoberta, busca, detalhes de pacote e
downloads. Catálogos de terceiros podem usar essas APIs quando vinculam de volta à
listagem canônica do ClawHub, respeitam limites de taxa e evitam sugerir endosso.

Consulte [API pública](/pt-BR/clawhub/api) e [API HTTP](/clawhub/http-api).
