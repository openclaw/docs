---
read_when:
    - Configurando o ambiente de desenvolvimento do macOS
summary: Guia de configuração para desenvolvedores que trabalham no aplicativo OpenClaw para macOS
title: Configuração de desenvolvimento no macOS
x-i18n:
    generated_at: "2026-07-16T12:40:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuração do ambiente de desenvolvimento no macOS

Compile e execute o aplicativo OpenClaw para macOS a partir do código-fonte.

## Pré-requisitos

- **Xcode 26.2+** (toolchain do Swift 6.2), na versão mais recente do macOS disponível na
  Atualização de Software.
- **Node.js 24.15+ e pnpm** para o Gateway, a CLI e os scripts de empacotamento. O Node
  22.22.3+ também funciona.

## 1. Instale as dependências

```bash
pnpm install
```

## 2. Compile e empacote o aplicativo

```bash
./scripts/package-mac-app.sh
```

Gera `dist/OpenClaw.app`. Sem um certificado Apple Developer ID, o
script usa assinatura ad hoc como alternativa.

Para modos de execução de desenvolvimento, opções de assinatura e solução de problemas do Team ID, consulte
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Ciclo rápido de desenvolvimento a partir da raiz do repositório: `scripts/restart-mac.sh` (adicione `--no-sign` para
assinatura ad hoc; as permissões do TCC não persistem com `--no-sign`).

<Note>
Aplicativos com assinatura ad hoc podem acionar avisos de segurança. Se o aplicativo falhar
imediatamente com "Abort trap 6", consulte [Solução de problemas](#troubleshooting).
</Note>

## 3. Instale a CLI e o Gateway

O aplicativo empacotado incorpora o instalador `scripts/install-cli.sh` canônico. Em um
perfil novo, escolha **This Mac** durante a integração inicial; o aplicativo instala a
CLI e o runtime correspondentes no espaço do usuário antes de iniciar o assistente do Gateway.

Para recuperação manual do ambiente de desenvolvimento, instale a CLI correspondente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>` também
funcionam. O Node continua sendo o runtime recomendado para o próprio Gateway.

## Solução de problemas

### Falha na compilação: incompatibilidade de toolchain ou SDK

A compilação do aplicativo para macOS requer o SDK mais recente do macOS e a toolchain do Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Se as versões não corresponderem, atualize o macOS/Xcode e execute a compilação novamente.

### O aplicativo falha ao conceder permissões

Se o aplicativo falhar ao tentar permitir acesso a **Speech Recognition** ou
**Microphone**, a causa pode ser um cache do TCC corrompido ou uma incompatibilidade de assinatura.

1. Redefina as permissões do TCC para o ID do pacote de depuração:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se isso falhar, altere temporariamente `BUNDLE_ID` em
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   para forçar um estado inicial limpo no macOS.

### Gateway permanece em "Starting..." indefinidamente

Verifique se um processo zumbi está mantendo a porta ocupada:

```bash
openclaw gateway status
openclaw gateway stop

# Se você não estiver usando um LaunchAgent (modo de desenvolvimento / execuções manuais), localize o processo que está escutando:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se uma execução manual estiver mantendo a porta ocupada, interrompa-a (Ctrl+C) ou, como
último recurso, encerre o PID encontrado acima.

## Relacionados

- [Aplicativo para macOS](/pt-BR/platforms/macos)
- [Visão geral da instalação](/pt-BR/install)
