---
read_when:
    - Configurando o ambiente de desenvolvimento do macOS
summary: Guia de configuração para desenvolvedores que trabalham no aplicativo OpenClaw para macOS
title: Configuração de desenvolvimento no macOS
x-i18n:
    generated_at: "2026-07-12T00:07:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuração do ambiente de desenvolvimento no macOS

Compile e execute o aplicativo OpenClaw para macOS a partir do código-fonte.

## Pré-requisitos

- **Xcode 26.2+** (conjunto de ferramentas do Swift 6.2), na versão mais recente do macOS disponível em
  Software Update.
- **Node.js 24 e pnpm** para o Gateway, a CLI e os scripts de empacotamento. O Node
  22.19+ também funciona.

## 1. Instale as dependências

```bash
pnpm install
```

## 2. Compile e empacote o aplicativo

```bash
./scripts/package-mac-app.sh
```

Gera `dist/OpenClaw.app`. Sem um certificado de ID de desenvolvedor da Apple, o
script usa a assinatura ad hoc como alternativa.

Para modos de execução de desenvolvimento, opções de assinatura e solução de problemas com o ID da equipe, consulte
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Ciclo rápido de desenvolvimento a partir da raiz do repositório: `scripts/restart-mac.sh` (adicione `--no-sign` para
assinatura ad hoc; as permissões do TCC não são mantidas com `--no-sign`).

<Note>
Aplicativos assinados de forma ad hoc podem acionar avisos de segurança. Se o aplicativo falhar
imediatamente com "Abort trap 6", consulte [Solução de problemas](#troubleshooting).
</Note>

## 3. Instale a CLI e o Gateway

O aplicativo empacotado incorpora o instalador canônico `scripts/install-cli.sh`. Em um
perfil novo, escolha **This Mac** durante a configuração inicial; o aplicativo instala a
CLI correspondente no espaço do usuário e o ambiente de execução antes de iniciar o assistente do Gateway.

Para recuperação manual do ambiente de desenvolvimento, instale você mesmo a CLI correspondente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>` também
funcionam. O Node continua sendo o ambiente de execução recomendado para o próprio Gateway.

## Solução de problemas

### Falha na compilação: incompatibilidade do conjunto de ferramentas ou do SDK

A compilação do aplicativo para macOS requer o SDK mais recente do macOS e o conjunto de ferramentas
do Swift 6.2 (Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Se as versões não forem compatíveis, atualize o macOS/Xcode e execute a compilação novamente.

### O aplicativo falha ao conceder uma permissão

Se o aplicativo falhar quando você tentar permitir acesso a **Speech Recognition** ou
**Microphone**, a causa pode ser um cache do TCC corrompido ou uma incompatibilidade de assinatura.

1. Redefina as permissões do TCC para o ID do pacote de depuração:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se isso falhar, altere temporariamente `BUNDLE_ID` em
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   para forçar o macOS a usar uma configuração limpa.

### Gateway permanece indefinidamente em "Starting..."

Verifique se um processo zumbi está ocupando a porta:

```bash
openclaw gateway status
openclaw gateway stop

# Se você não estiver usando um LaunchAgent (modo de desenvolvimento / execuções manuais), encontre o processo que está escutando:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se uma execução manual estiver ocupando a porta, interrompa-a (Ctrl+C) ou, como
último recurso, encerre o PID encontrado acima.

## Conteúdo relacionado

- [Aplicativo para macOS](/pt-BR/platforms/macos)
- [Visão geral da instalação](/pt-BR/install)
