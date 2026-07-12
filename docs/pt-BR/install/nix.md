---
read_when:
    - Você quer instalações reproduzíveis e reversíveis
    - Você já está usando Nix/NixOS/Home Manager
    - Você quer que tudo fique fixado em versões específicas e seja gerenciado de forma declarativa
summary: Instale o OpenClaw declarativamente com o Nix
title: Nix
x-i18n:
    generated_at: "2026-07-12T15:22:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

Instale o OpenClaw declarativamente com o **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**, o módulo oficial e completo do Home Manager.

<Info>
O repositório [nix-openclaw](https://github.com/openclaw/nix-openclaw) é a fonte oficial para a instalação com Nix. Esta página apresenta uma visão geral rápida.
</Info>

## O que você obtém

- Gateway + aplicativo para macOS + ferramentas (whisper, spotify, câmeras), todos com versões fixadas
- Serviço launchd que continua funcionando após reinicializações
- Sistema de Plugins com configuração declarativa
- Reversão instantânea: `home-manager switch --rollback`

## Início rápido

<Steps>
  <Step title="Instale o Determinate Nix">
    Se o Nix ainda não estiver instalado, siga as instruções do [instalador do Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Crie um flake local">
    Use o modelo voltado a agentes do repositório nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copie templates/agent-first/flake.nix do repositório nix-openclaw
    ```
  </Step>
  <Step title="Configure os segredos">
    Configure o token do seu bot de mensagens e a chave de API do provedor de modelos. Arquivos simples em `~/.secrets/` funcionam bem.
  </Step>
  <Step title="Preencha os espaços reservados do modelo e aplique">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verifique">
    Confirme que o serviço launchd está em execução e que seu bot responde às mensagens.
  </Step>
</Steps>

Consulte o [README do nix-openclaw](https://github.com/openclaw/nix-openclaw) para ver todas as opções e exemplos do módulo.

## Comportamento do ambiente de execução no modo Nix

Quando `OPENCLAW_NIX_MODE=1` está definido (automaticamente com o nix-openclaw), o OpenClaw entra em um modo determinístico para instalações gerenciadas pelo Nix. Outros pacotes Nix podem definir o mesmo modo; o nix-openclaw é a referência oficial.

Você também pode defini-lo manualmente:

```bash
export OPENCLAW_NIX_MODE=1
```

No macOS, o aplicativo com interface gráfica não herda as variáveis de ambiente do shell. Em vez disso, ative o modo Nix por meio de `defaults`:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### O que muda no modo Nix

- Os fluxos de instalação automática e automodificação são desativados.
- `openclaw.json` é tratado como imutável. Os padrões derivados na inicialização permanecem somente no ambiente de execução, e os gravadores de configuração (configuração inicial, integração, `openclaw update` com alterações, instalação/atualização/desinstalação/ativação de Plugins, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) se recusam a editar o arquivo.
- Em vez disso, edite a fonte Nix. Para o nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) voltado a agentes e defina a configuração em `programs.openclaw.config` ou `instances.<name>.config`.
- Dependências ausentes exibem mensagens de correção específicas do Nix.
- A interface exibe um banner de modo Nix somente leitura.

### Caminhos de configuração e estado

O OpenClaw lê a configuração JSON5 de `OPENCLAW_CONFIG_PATH` e armazena dados mutáveis em `OPENCLAW_STATE_DIR`. No Nix, defina-os explicitamente como locais gerenciados pelo Nix para que o estado do ambiente de execução e a configuração permaneçam fora do armazenamento imutável.

| Variável               | Padrão                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Descoberta do PATH do serviço

O serviço do Gateway para launchd/systemd descobre automaticamente os binários dos perfis Nix para que Plugins e ferramentas que executam executáveis instalados pelo `nix` por meio do shell funcionem sem configuração manual do PATH:

- Quando `NIX_PROFILES` está definido, cada entrada é adicionada ao PATH do serviço com precedência da direita para a esquerda (corresponde à precedência do shell Nix: a entrada mais à direita prevalece).
- Quando `NIX_PROFILES` não está definido, `~/.nix-profile/bin` é adicionado como alternativa.

Isso se aplica tanto aos ambientes de serviço do launchd no macOS quanto aos do systemd no Linux.

## Relacionados

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Módulo oficial do Home Manager e guia completo de configuração.
  </Card>
  <Card title="Assistente de configuração" href="/pt-BR/start/wizard" icon="wand-magic-sparkles">
    Guia passo a passo para configuração pela CLI sem Nix.
  </Card>
  <Card title="Docker" href="/pt-BR/install/docker" icon="docker">
    Configuração em contêiner como alternativa sem Nix.
  </Card>
  <Card title="Atualização" href="/pt-BR/install/updating" icon="arrow-up-right-from-square">
    Atualização de instalações gerenciadas pelo Home Manager em conjunto com o pacote.
  </Card>
</CardGroup>
