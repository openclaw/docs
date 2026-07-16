---
read_when:
    - Explicando o que é o ClawHub
    - Pesquisar, instalar ou atualizar Skills ou plugins
    - Publicação de Skills ou plugins no registro
    - Escolha entre os fluxos da CLI do OpenClaw e do ClawHub
sidebarTitle: ClawHub
summary: Visão geral pública do ClawHub para descoberta, instalação, publicação, segurança e a CLI do clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-16T12:18:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub é o registro público de Skills e plugins do OpenClaw.

- Use comandos nativos de `openclaw` para pesquisar, instalar e atualizar Skills e para instalar plugins do ClawHub.
- Use a CLI separada `clawhub` para autenticação no registro, publicação e fluxos de exclusão/restauração.

Site: [clawhub.ai](https://clawhub.ai)

## Início rápido

Pesquise e instale Skills com o OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Pesquise e instale plugins com o OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Instale a CLI do ClawHub quando quiser usar fluxos autenticados no registro, como
publicação ou exclusão/restauração:

```bash
npm i -g clawhub
# ou
pnpm add -g clawhub
```

## O que o ClawHub hospeda

| Superfície       | O que armazena                                                    | Comando típico                               |
| ---------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| Skills           | Pacotes de texto versionados com `SKILL.md` e arquivos de apoio | `openclaw skills install @openclaw/demo`     |
| Plugins de código | Pacotes de plugins do OpenClaw com metadados de compatibilidade   | `openclaw plugins install clawhub:<package>` |
| Plugins em pacote | Pacotes de plugins empacotados para distribuição pelo OpenClaw    | `clawhub package publish <source>`           |

O ClawHub rastreia versões semver, tags como `latest`, registros de alterações, arquivos,
downloads, estrelas e resumos de verificações de segurança. As páginas públicas mostram o estado
atual do registro para que os usuários possam inspecionar uma Skill ou um plugin antes de instalá-lo.

## Fluxos nativos do OpenClaw

Os comandos nativos do OpenClaw instalam no workspace ativo do OpenClaw e mantêm
os metadados da origem para que os comandos de atualização posteriores continuem usando o ClawHub.

Use `clawhub:<package>` quando a instalação de um plugin precisar ser resolvida pelo ClawHub.
Especificações simples de plugins compatíveis com npm podem ser resolvidas pelo npm durante transições de lançamento, e
`npm:<package>` permanece exclusivo do npm quando a origem precisa ser explícita.

As instalações de plugins validam a compatibilidade anunciada de `pluginApi` e `minGatewayVersion`
antes da instalação do arquivo. Quando uma versão do pacote publica um artefato
ClawPack, o OpenClaw prefere o `.tgz` exato do npm-pack enviado, verifica
o cabeçalho de resumo criptográfico do ClawHub e os bytes baixados e registra os metadados do artefato para
atualizações posteriores.

## CLI do ClawHub

A CLI do ClawHub é destinada a operações autenticadas no registro:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

A CLI também oferece comandos de instalação/atualização de Skills para fluxos diretos com o registro:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Esses comandos instalam Skills em `./skills`, no diretório de trabalho atual,
e registram as versões instaladas em `.clawhub/lock.json`.

## Publicação

Publique Skills a partir de uma pasta local que contenha `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opções comuns de publicação:

- `--slug <slug>`: nome da URL da Skill publicada.
- `--name <name>`: nome de exibição.
- `--version <version>`: versão semver.
- `--changelog <text>`: texto do registro de alterações.
- `--tags <tags>`: tags separadas por vírgulas, com padrão `latest`.

Publique plugins a partir de uma pasta local, `owner/repo`, `owner/repo@ref` ou uma
URL do GitHub:

```bash
clawhub package publish <source>
```

Use `--dry-run` para criar o plano exato de publicação sem fazer upload e `--json`
para uma saída adequada à CI.

Os plugins de código devem incluir os metadados obrigatórios de compatibilidade com o OpenClaw em
`package.json`, incluindo `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`. Consulte [CLI](/pt-BR/clawhub/cli) para ver a referência completa dos
comandos e [Formato de Skill](/clawhub/skill-format) para os metadados de Skills.

## Segurança e moderação

O ClawHub é aberto por padrão: qualquer pessoa pode fazer upload, mas a publicação exige uma conta
do GitHub antiga o suficiente para passar pelo controle de upload. As páginas públicas de detalhes resumem o
estado da verificação mais recente antes da instalação ou do download.

O ClawHub executa verificações automatizadas nas Skills e versões de plugins publicadas. Versões retidas
pela verificação ou bloqueadas podem desaparecer do catálogo público e das superfícies de instalação, mas
continuam visíveis para seus proprietários em `/dashboard`.

Usuários conectados podem denunciar Skills e pacotes. Os moderadores podem analisar denúncias,
ocultar ou restaurar conteúdo e banir contas abusivas. Consulte
[Segurança](/pt-BR/clawhub/security),
[Auditorias de segurança](/clawhub/security-audits),
[Moderação e segurança da conta](/clawhub/moderation) e
[Uso aceitável](/clawhub/acceptable-usage) para ver detalhes sobre políticas e aplicação.

## Telemetria e ambiente

Ao executar `clawhub install` enquanto estiver conectado, a CLI poderá enviar, na medida do possível,
um evento de instalação para que o ClawHub possa calcular contagens agregadas de instalações. Desative isso com:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Substituições úteis de ambiente:

| Variável                      | Efeito                                                   |
| ----------------------------- | -------------------------------------------------------- |
| `CLAWHUB_SITE`            | Substitui a URL do site usada para login pelo navegador. |
| `CLAWHUB_REGISTRY`            | Substitui a URL da API do registro.                      |
| `CLAWHUB_CONFIG_PATH`            | Substitui o local onde a CLI armazena tokens/configuração. |
| `CLAWHUB_WORKDIR`            | Substitui o diretório de trabalho padrão.                |
| `CLAWHUB_DISABLE_TELEMETRY=1`            | Desativa a telemetria de instalação.                     |

Consulte [Telemetria](/clawhub/telemetry), [API HTTP](/clawhub/http-api) e
[Solução de problemas](/pt-BR/clawhub/troubleshooting) para obter materiais de referência mais detalhados.
