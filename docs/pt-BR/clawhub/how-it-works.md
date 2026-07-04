---
read_when:
    - Entendendo listagens, versões, instalações, publicação e moderação
summary: Como funcionam as listagens, versões, instalações, publicação, varreduras e atualizações do ClawHub.
x-i18n:
    generated_at: "2026-07-04T03:38:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Como o ClawHub funciona

ClawHub é a camada de registro para Skills e plugins do OpenClaw. Ele oferece aos usuários um
lugar para descobrir pacotes, aos publicadores um lugar para lançar versões e
ao OpenClaw metadados suficientes para instalar e atualizar esses pacotes com segurança.

## Registros do registry

Cada listagem pública é um registro do registry com:

- um proprietário e slug ou nome de pacote
- uma ou mais versões publicadas
- metadados, resumo, arquivos e atribuição de origem
- changelog e informações de tags, como `latest`
- sinais de download, instalação e estrela
- status de varredura de segurança e moderação

A página de listagem é o lugar canônico para os usuários inspecionarem o que uma skill ou
plugin afirma fazer antes de instalá-la.

## Skills

Uma skill é um pacote de texto versionado centrado em `SKILL.md`. Ela pode incluir
arquivos de suporte, exemplos, modelos e scripts.

O ClawHub lê o frontmatter de `SKILL.md` para entender o nome da skill,
descrição, requisitos, variáveis de ambiente e metadados. Metadados precisos
importam porque ajudam os usuários a decidir se devem instalar a skill e
ajudam varreduras automatizadas a detectar divergências entre o comportamento declarado e o observado.

Veja [Formato de skill](/pt-BR/clawhub/skill-format).

## Plugins

Plugins são extensões empacotadas do OpenClaw. O ClawHub armazena metadados do pacote,
informações de compatibilidade, links de origem, artefatos e registros de versão.

Quando o OpenClaw instala um plugin do ClawHub, ele verifica os metadados de compatibilidade
anunciados antes de instalar. Registros de pacote podem incluir compatibilidade de API,
versão mínima do gateway, destinos de host, requisitos de ambiente e resumos criptográficos de artefatos.

Use uma origem de instalação explícita do ClawHub quando quiser que o registry seja a
fonte da verdade:

```bash
openclaw plugins install clawhub:<package>
```

## Publicação

Publicar cria um novo registro de versão imutável. Publicadores usam a CLI `clawhub`
para fluxos de trabalho autenticados do registry:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Use execuções de simulação para visualizar a carga útil resolvida antes do upload. As páginas públicas então
exibem os metadados publicados, arquivos, atribuição de origem e status da varredura.

## Instalações e atualizações

Os comandos de instalação do OpenClaw usam o ClawHub como origem de pacote:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

O OpenClaw registra metadados da origem de instalação para que atualizações possam resolver o mesmo
pacote do registry posteriormente. A CLI do ClawHub também oferece suporte a fluxos de trabalho diretos de instalação e
atualização de skills para usuários que desejam pastas de skills gerenciadas pelo registry fora de um
workspace completo do OpenClaw.

## Estado de segurança

O ClawHub é aberto para publicação, mas lançamentos ainda estão sujeitos a barreiras de upload,
verificações automatizadas, relatos de usuários e ação de moderadores.

Páginas públicas mostram resumos de varredura quando disponíveis. Conteúdo retido, oculto
ou bloqueado pode desaparecer da busca pública e dos fluxos de instalação, enquanto permanece
visível para o proprietário para diagnóstico.

Veja [Segurança](/clawhub/security), [Auditorias de segurança](/clawhub/security-audits),
[Moderação e segurança da conta](/pt-BR/clawhub/moderation) e
[Uso aceitável](/clawhub/acceptable-usage).

## Acesso à API

O ClawHub expõe APIs públicas de leitura para descoberta, busca, detalhes de pacotes e
downloads. Catálogos de terceiros podem usar essas APIs quando vincularem de volta à
listagem canônica do ClawHub, respeitarem limites de taxa e evitarem sugerir endosso.

Veja [API pública](/pt-BR/clawhub/api) e [API HTTP](/clawhub/http-api).
