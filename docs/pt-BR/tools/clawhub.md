---
read_when:
    - Buscando, instalando ou atualizando Skills ou plugins
    - Publicando Skills ou plugins no registro
    - Configurando a CLI clawhub ou suas substituições de ambiente
sidebarTitle: ClawHub
summary: 'ClawHub: registro público de Skills e plugins do OpenClaw, fluxos nativos de instalação e a CLI clawhub'
title: ClawHub
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:38:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e002bb56b643bfdfb5715ac3632d854df182475be632ebe36c46d04008cf6e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub é o registro público de **Skills e plugins do OpenClaw**.

- Use comandos nativos `openclaw` para pesquisar, instalar e atualizar Skills, e para instalar plugins do ClawHub.
- Use a CLI separada `clawhub` para autenticação no registro, publicação, exclusão/restauração e fluxos de sincronização.

Site: [clawhub.ai](https://clawhub.ai)

## Início rápido

<Steps>
  <Step title="Pesquisar">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Instalar">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Usar">
    Inicie uma nova sessão do OpenClaw — ela reconhecerá a nova Skill.
  </Step>
  <Step title="Publicar (opcional)">
    Para fluxos autenticados no registro (publicar, sincronizar, gerenciar), instale
    a CLI separada `clawhub`:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Fluxos nativos do OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Os comandos nativos `openclaw` instalam no seu workspace ativo e
    persistem os metadados de origem para que chamadas posteriores de `update` possam continuar no ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Especificações de plugin compatíveis com npm sem prefixo também são tentadas no ClawHub antes do npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    As instalações de plugin validam a compatibilidade anunciada de `pluginApi` e
    `minGatewayVersion` antes de a instalação do arquivo ser executada, para que
    hosts incompatíveis falhem de forma segura logo no início, em vez de instalar
    parcialmente o pacote.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` aceita apenas famílias de plugin instaláveis.
Se um pacote do ClawHub for na verdade uma Skill, o OpenClaw interrompe e
direciona você para `openclaw skills install <slug>`.

Instalações anônimas de plugins do ClawHub também falham de forma segura para pacotes privados.
Canais da comunidade ou outros canais não oficiais ainda podem instalar, mas o OpenClaw
emite um aviso para que os operadores possam revisar a origem e a verificação antes de ativá-los.
</Note>

## O que é o ClawHub

- Um registro público para Skills e plugins do OpenClaw.
- Um armazenamento versionado de pacotes de Skills e metadados.
- Uma superfície de descoberta para pesquisa, tags e sinais de uso.

Uma Skill típica é um pacote versionado de arquivos que inclui:

- Um arquivo `SKILL.md` com a descrição principal e o uso.
- Configurações, scripts ou arquivos de suporte opcionais usados pela Skill.
- Metadados como tags, resumo e requisitos de instalação.

O ClawHub usa metadados para impulsionar a descoberta e expor com segurança as
capacidades da Skill. O registro acompanha sinais de uso (estrelas, downloads) para
melhorar classificação e visibilidade. Cada publicação cria uma nova versão
semver, e o registro mantém o histórico de versões para que os usuários possam auditar
mudanças.

## Workspace e carregamento de Skills

A CLI separada `clawhub` também instala Skills em `./skills` dentro do
seu diretório de trabalho atual. Se um workspace do OpenClaw estiver configurado,
`clawhub` usa esse workspace como fallback, a menos que você substitua com `--workdir`
(ou `CLAWHUB_WORKDIR`). O OpenClaw carrega Skills do workspace de
`<workspace>/skills` e as reconhece na **próxima** sessão.

Se você já usa `~/.openclaw/skills` ou Skills agrupadas,
as Skills do workspace têm precedência. Para mais detalhes sobre como as Skills são carregadas,
compartilhadas e controladas, veja [Skills](/pt-BR/tools/skills).

## Recursos do serviço

| Recurso            | Observações                                                 |
| ------------------ | ----------------------------------------------------------- |
| Navegação pública  | As Skills e seu conteúdo `SKILL.md` podem ser vistos publicamente. |
| Pesquisa           | Baseada em embeddings (busca vetorial), não apenas em palavras-chave. |
| Versionamento      | Semver, changelogs e tags (incluindo `latest`).             |
| Downloads          | Zip por versão.                                             |
| Estrelas e comentários | Feedback da comunidade.                                  |
| Moderação          | Aprovações e auditorias.                                    |
| API amigável para CLI | Adequada para automação e scripts.                        |

## Segurança e moderação

O ClawHub é aberto por padrão — qualquer pessoa pode enviar Skills, mas uma conta do GitHub
deve ter **pelo menos uma semana de existência** para publicar. Isso reduz
abusos sem bloquear contribuidores legítimos.

<AccordionGroup>
  <Accordion title="Denúncias">
    - Qualquer usuário autenticado pode denunciar uma Skill.
    - Motivos de denúncia são obrigatórios e registrados.
    - Cada usuário pode ter até 20 denúncias ativas ao mesmo tempo.
    - Skills com mais de 3 denúncias únicas ficam automaticamente ocultas por padrão.
  </Accordion>
  <Accordion title="Moderação">
    - Moderadores podem ver Skills ocultas, reexibi-las, excluí-las ou banir usuários.
    - O abuso do recurso de denúncia pode resultar em banimento da conta.
    - Tem interesse em se tornar moderador? Pergunte no Discord do OpenClaw e entre em contato com um moderador ou maintainer.
  </Accordion>
</AccordionGroup>

## CLI do ClawHub

Você só precisa dela para fluxos autenticados no registro, como
publicação/sincronização.

### Opções globais

<ParamField path="--workdir <dir>" type="string">
  Diretório de trabalho. Padrão: diretório atual; usa o workspace do OpenClaw como fallback.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Diretório de Skills, relativo ao diretório de trabalho.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL base do site (login no navegador).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL base da API do registro.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Desativa prompts (não interativo).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Exibe a versão da CLI.
</ParamField>

### Comandos

<AccordionGroup>
  <Accordion title="Autenticação (login / logout / whoami)">
    ```bash
    clawhub login              # fluxo pelo navegador
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Opções de login:

    - `--token <token>` — cole um token de API.
    - `--label <label>` — rótulo armazenado para tokens de login via navegador (padrão: `CLI token`).
    - `--no-browser` — não abre um navegador (exige `--token`).

  </Accordion>
  <Accordion title="Pesquisar">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — máximo de resultados.

  </Accordion>
  <Accordion title="Instalar / atualizar / listar">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opções:

    - `--version <version>` — instala ou atualiza para uma versão específica (apenas um slug no `update`).
    - `--force` — sobrescreve se a pasta já existir, ou quando os arquivos locais não corresponderem a nenhuma versão publicada.
    - `clawhub list` lê `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publicar Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Opções:

    - `--slug <slug>` — slug da Skill.
    - `--name <name>` — nome de exibição.
    - `--version <version>` — versão semver.
    - `--changelog <text>` — texto do changelog (pode estar vazio).
    - `--tags <tags>` — tags separadas por vírgula (padrão: `latest`).

  </Accordion>
  <Accordion title="Publicar plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` pode ser uma pasta local, `owner/repo`, `owner/repo@ref` ou uma
    URL do GitHub.

    Opções:

    - `--dry-run` — monta o plano exato de publicação sem enviar nada.
    - `--json` — emite saída legível por máquina para CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — substituições opcionais quando a detecção automática não for suficiente.

  </Accordion>
  <Accordion title="Excluir / restaurar (proprietário ou admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sincronizar (verificar local + publicar itens novos ou atualizados)">
    ```bash
    clawhub sync
    ```

    Opções:

    - `--root <dir...>` — raízes extras para verificação.
    - `--all` — envia tudo sem prompts.
    - `--dry-run` — mostra o que seria enviado.
    - `--bump <type>` — `patch|minor|major` para atualizações (padrão: `patch`).
    - `--changelog <text>` — changelog para atualizações não interativas.
    - `--tags <tags>` — tags separadas por vírgula (padrão: `latest`).
    - `--concurrency <n>` — verificações no registro (padrão: `4`).

  </Accordion>
</AccordionGroup>

## Fluxos comuns

<Tabs>
  <Tab title="Pesquisar">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Instalar">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Atualizar tudo">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Publicar uma única Skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Sincronizar várias Skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publicar um plugin do GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Metadados de pacote de plugin

Plugins de código devem incluir os metadados obrigatórios do OpenClaw em
`package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Pacotes publicados devem distribuir **JavaScript compilado** e apontar
`runtimeExtensions` para essa saída. Instalações por checkout do Git ainda podem
usar código-fonte TypeScript como fallback quando não existirem arquivos compilados, mas entradas
de runtime compiladas evitam compilação TypeScript em runtime na inicialização, em doctor e
nos caminhos de carregamento de plugin.

## Versionamento, lockfile e telemetria

<AccordionGroup>
  <Accordion title="Versionamento e tags">
    - Cada publicação cria uma nova `SkillVersion` **semver**.
    - Tags (como `latest`) apontam para uma versão; mover tags permite rollback.
    - Changelogs são anexados por versão e podem estar vazios ao sincronizar ou publicar atualizações.
  </Accordion>
  <Accordion title="Mudanças locais vs versões do registro">
    As atualizações comparam o conteúdo local da Skill com as versões do registro usando um
    hash de conteúdo. Se os arquivos locais não corresponderem a nenhuma versão publicada, a
    CLI perguntará antes de sobrescrever (ou exigirá `--force` em
    execuções não interativas).
  </Accordion>
  <Accordion title="Verificação de sincronização e raízes de fallback">
    `clawhub sync` verifica primeiro o seu diretório de trabalho atual. Se nenhuma Skill for
    encontrada, ele usa locais legados conhecidos como fallback (por exemplo
    `~/openclaw/skills` e `~/.openclaw/skills`). Isso foi projetado para
    encontrar instalações mais antigas de Skills sem flags extras.
  </Accordion>
  <Accordion title="Armazenamento e lockfile">
    - As Skills instaladas são registradas em `.clawhub/lock.json` no seu diretório de trabalho.
    - Tokens de autenticação são armazenados no arquivo de configuração da CLI do ClawHub (substituível via `CLAWHUB_CONFIG_PATH`).
  </Accordion>
  <Accordion title="Telemetria (contagem de instalações)">
    Quando você executa `clawhub sync` autenticado, a CLI envia um snapshot mínimo
    para calcular contagens de instalação. Você pode desativar isso completamente:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente

| Variável                     | Efeito                                           |
| ---------------------------- | ------------------------------------------------ |
| `CLAWHUB_SITE`               | Substitui a URL do site.                         |
| `CLAWHUB_REGISTRY`           | Substitui a URL da API do registro.              |
| `CLAWHUB_CONFIG_PATH`        | Substitui onde a CLI armazena o token/configuração. |
| `CLAWHUB_WORKDIR`            | Substitui o diretório de trabalho padrão.        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Desativa a telemetria em `sync`.                |

## Relacionado

- [Plugins da comunidade](/pt-BR/plugins/community)
- [Plugins](/pt-BR/tools/plugin)
- [Skills](/pt-BR/tools/skills)
