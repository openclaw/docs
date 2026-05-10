---
read_when:
    - Entendendo listagens, versões, instalações, publicação e moderação
summary: Como funcionam as listagens, versões, instalações, publicação, varreduras e atualizações do ClawHub.
x-i18n:
    generated_at: "2026-05-10T19:25:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Como o ClawHub funciona

O ClawHub é a camada de registro para Skills e plugins do OpenClaw. Ele oferece aos usuários um
lugar para descobrir pacotes, aos publicadores um lugar para lançar versões e
ao OpenClaw metadados suficientes para instalar e atualizar esses pacotes com segurança.

## Registros do registro

Cada listagem pública é um registro do registro com:

- um proprietário e slug ou nome de pacote
- uma ou mais versões publicadas
- metadados, resumo, arquivos e atribuição de origem
- changelog e informações de tag, como `latest`
- sinais de download, instalação, estrela e comentário
- varredura de segurança e status de moderação

A página da listagem é o local canônico para os usuários inspecionarem o que uma skill ou
Plugin afirma fazer antes de instalá-lo.

## Skills

Uma skill é um pacote de texto versionado centrado em `SKILL.md`. Ela pode incluir
arquivos de suporte, exemplos, modelos e scripts.

O ClawHub lê o frontmatter do `SKILL.md` para entender o nome da skill,
descrição, requisitos, variáveis de ambiente e metadados. Metadados precisos
são importantes porque ajudam os usuários a decidir se devem instalar a skill e
ajudam varreduras automatizadas a detectar incompatibilidades entre o comportamento declarado e o observado.

Consulte [Formato de skill](/pt-BR/clawhub/skill-format).

## Plugins

Plugins são extensões empacotadas do OpenClaw. O ClawHub armazena metadados de pacote,
informações de compatibilidade, links de origem, artefatos e registros de versão.

Quando o OpenClaw instala um Plugin do ClawHub, ele verifica os metadados de compatibilidade
anunciados antes de instalar. Registros de pacote podem incluir compatibilidade de API,
versão mínima do gateway, destinos de host, requisitos de ambiente e resumos criptográficos
de artefatos.

Use uma fonte de instalação explícita do ClawHub quando quiser que o registro seja a
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

Use simulações para visualizar o payload resolvido antes do envio. As páginas públicas então
exibem os metadados publicados, arquivos, atribuição de origem e status da varredura.

## Instalações e atualizações

Os comandos de instalação do OpenClaw usam o ClawHub como fonte de pacote:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

O OpenClaw registra metadados da fonte de instalação para que atualizações possam resolver o mesmo
pacote do registro posteriormente. A CLI do ClawHub também oferece suporte a fluxos de trabalho diretos de instalação e
atualização de skills para usuários que querem pastas de skills gerenciadas pelo registro fora de um
workspace completo do OpenClaw.

## Estado de segurança

O ClawHub é aberto para publicação, mas os lançamentos ainda estão sujeitos a barreiras de upload,
verificações automatizadas, denúncias de usuários e ação de moderadores.

Páginas públicas mostram resumos de varredura quando disponíveis. Conteúdo retido, oculto
ou bloqueado pode desaparecer da busca pública e dos fluxos de instalação, permanecendo
visível ao proprietário para diagnóstico ou recurso.

Consulte [Segurança + moderação](/pt-BR/clawhub/security) e
[Uso aceitável](/pt-BR/clawhub/acceptable-usage).

## Acesso à API

O ClawHub expõe APIs públicas de leitura para descoberta, busca, detalhes de pacote e
downloads. Catálogos de terceiros podem usar essas APIs quando vincularem de volta à
listagem canônica do ClawHub, respeitarem limites de taxa e evitarem insinuar endosso.

Consulte [API pública](/pt-BR/clawhub/api) e [API HTTP](/pt-BR/clawhub/http-api).
