---
summary: "Experimental FaceTime carrier for a private OpenClaw voice session on a dedicated Mac"
read_when:
  - You want to configure FaceTime calls with your OpenClaw agent
  - You are evaluating or developing the FaceTime plugin
  - You need its owner, driver, or private-API requirements
title: "FaceTime plugin"
sidebarTitle: "FaceTime (experimental)"
---

The FaceTime plugin is an experimental external plugin for an Apple Silicon Mac.
It can answer configured owner handles, place an explicitly
approved outgoing call, bridge call audio to a realtime provider, consult the
configured OpenClaw agent, and request carrier hangup.

**Status: experimental, disabled by default.** Configure this voice plugin under
`plugins.entries.facetime`. It does not use iMessage channel configuration.
Run the Gateway and native helper in the same signed-in Mac user session.
The realtime provider handles speech; your configured agent handles calendar,
memory, and other tool-backed requests through its normal tools and permissions.

<Warning>
This plugin injects a helper into protected Apple call applications and uses
private APIs. It is appropriate only on a dedicated, patched, physically
controlled Mac whose operator accepts that security boundary. The plugin never
changes System Integrity Protection, developer-tools policy, TCC permissions,
or System Settings automatically.
</Warning>

## Requirements

- Apple Silicon and macOS 14.4 or later
- OpenClaw 2026.9.4 or later
- signed native helpers from `openclaw/openclaw-facetime`
- full Xcode at `/Applications/Xcode.app`
- FaceTime signed in for the logged-in user
- a configured realtime voice provider
- consent from everyone whose audio will be processed

The setup below requires published plugin and matching signed native artifacts.
If the npm package or Homebrew formula is unavailable, stop at installation and
wait for the native release owners. A working development installation is not
proof that the public release is available.

## Install the plugin and native companion

Install the plugin and its signed and notarized native helpers, then restart the
Gateway:

```bash
openclaw plugins install @openclaw/facetime
brew install openclaw/tap/openclaw-facetime
openclaw gateway restart
```

The plugin requires native protocol version 1. Before staging the injected
helper, it requires the exact `Developer ID Application: OpenClaw Foundation
(FWJYW4S8P8)` identity and an accepted Apple notarization ticket. It fails
closed when the installed package is missing, incompatible, or signed by any
other identity.

## Configure owner identities

Every accepted handle receives owner authority. There is no guest tier.
Use only your own FaceTime email addresses or full international phone numbers.
Merge this example into your existing configuration; preserve other plugin
entries and append `facetime` to an existing `plugins.allow` list.

```json5
{
  plugins: {
    allow: ["facetime"],
    entries: {
      facetime: {
        enabled: true,
        config: {
          ownerHandles: ["owner@example.com", "+12065550123"],
          realtime: {
            // Pin the provider to keep automatic selection from changing it.
            provider: "openai",
            sessionKey: "main",
            toolPolicy: "owner",
          },
        },
      },
    },
  },
}
```

`realtime.provider`, `realtime.model`, and `realtime.voice` are optional
overrides. When omitted, the registered realtime voice providers own provider
auto-selection, authentication, model defaults, and voice defaults. The OpenAI
provider above is an explicit choice, not a FaceTime plugin default. Leave
`model` and `voice` unset to use that provider's defaults, or set them explicitly
to supported values when you need a consistent voice.

### Configure voice credentials

The realtime provider needs its own usable credentials. A working text-agent
login does not by itself prove realtime voice authentication is configured.
Use the provider's normal authentication or an existing
[SecretRef](/gateway/secrets) at
`plugins.entries.facetime.config.realtime.providers.openai.apiKey`.
For an environment-backed key, the additional configuration is:

```json5
{
  secrets: {
    providers: {
      voiceenv: { source: "env", allowlist: ["OPENAI_API_KEY"] },
    },
  },
  plugins: {
    entries: {
      facetime: {
        config: {
          realtime: {
            providers: {
              openai: {
                apiKey: { source: "env", provider: "voiceenv", id: "OPENAI_API_KEY" },
              },
            },
          },
        },
      },
    },
  },
}
```

Make `OPENAI_API_KEY` available to the Gateway process, not just an interactive
terminal. If you already have a file-backed or other supported SecretRef, reuse
it instead of copying the key into configuration. Never share credential values
in logs or support reports.

### Choose the agent and tool access

`realtime.sessionKey: "main"` selects the default agent. To select another
configured agent, use an agent-qualified key such as `agent:assistant:main`,
replacing `assistant` with its agent ID. Each call gets a separate FaceTime
consult session for that agent. It can inherit context from the source session
without appending the call's turns to that source chat.
The agent's workspace, tools, authentication, and approval policies still apply.
Configure and verify calendar access for that agent before testing it by phone.

`realtime.toolPolicy` accepts `safe-read-only`, `owner`, or `none`. An invalid
explicit value fails configuration; it is never upgraded to `owner`.

- `owner` uses the selected agent's normal tool policy and approval checks. Use
  this for your existing calendar and other plugin tools.
- `safe-read-only` restricts consults to a fixed set of file, search, web-fetch,
  and memory tools. It does not include arbitrary read-only calendar plugins.
- `none` disables agent consults. Voice conversation and call control remain,
  but the voice provider cannot retrieve your calendar through the agent.

Outgoing targets must match `ownerHandles`. Agent-initiated calls through
`facetime_call` require one-shot approval; the Gateway dial method below is an
explicit operator action requiring `operator.write` access.
A matching phone number is never sufficient to grant owner authority: the
native helper and plugin both require a provider-classified FaceTime transport
and reject cellular, baseband, Wi-Fi Calling/PSTN, emergency, and unknown calls.

Prototype builds used `whitelistHandles`, `helperHost`, `helperPort`, and
`realtime.brain`. Run `openclaw doctor --fix` once after upgrading. Doctor moves
the old caller list to `ownerHandles` and removes the retired helper and brain
keys before strict plugin validation.

## Prepare the Mac

The helper requires debugger attachment to FaceTime and Phone. Setup reports
developer-tools and SIP debugging restrictions, but does not repair them.
Review the security tradeoff and manual recovery steps in
[FaceTime recovery and removal](/plugins/facetime-recovery).

If you accept that tradeoff, use an interactive administrator session to enable
developer-tools access:

```bash
sudo /usr/sbin/DevToolsSecurity -enable
```

If setup reports that SIP debugging restrictions block attachment, shut down
the Mac, hold the power button for startup options, choose **Options**, and
open **Utilities > Terminal** in macOS Recovery. Run:

```bash
csrutil enable --without debug
```

Reboot into your normal user session and rerun `facetime.setup`. This reduces
macOS security by allowing debugger attachment while retaining the other SIP
protections. Do not disable all of SIP or change it to troubleshoot unrelated
credential or driver errors. Complete any reported macOS permission prompts
from the same user session that runs the Gateway.

Install or update the local paired audio driver through the admin-scoped
methods:

```bash
openclaw gateway call facetime.installDriver --json
openclaw gateway call facetime.updateDriver --json
openclaw gateway call facetime.driverStatus --json
```

The administrator phase downloads pinned BlackHole v0.7.1 source, verifies its
fixed SHA-256, and builds it with fixed options in a root-only temporary
directory. Before compilation it requires the canonical
`/Applications/Xcode.app` bundle, its complete sealed contents, and the selected
`xcodebuild`, `clang`, linker, and libtool binaries to be Apple-signed,
root-owned, and not group/world writable. It does not accept a caller-built
driver, digest, or compiler path.
If Xcode fails this trust check, reinstall Xcode from Apple into `/Applications`
through an administrator-managed installation; the plugin does not change
Xcode ownership, permissions, or signatures. Driver replacement remains
transactional: failure restores the previous driver, and Core Audio restarts
only after a committed replacement. Generated GPL artifacts are not
distributed with OpenClaw.

Configure FaceTime and Phone to use:

- microphone: `OpenClaw-Mic`
- output: physical speakers or headphones

Do not use an aggregate, multi-output, BlackHole, `OpenClaw-Mic`, or
`OpenClaw-Feed` device as call output.

## Inspect and activate

After saving configuration, restart the Gateway when no call is active, then
inspect the plugin without placing a call:

```bash
openclaw gateway restart
openclaw gateway call facetime.status --json
```

`facetime.status`, model `get_status`, and model `check_readiness` perform
static inspection when the runtime is inactive. They do not compile helpers,
open apps, inject, install, or start call media.

Explicit live inspection and repair are admin actions:

```bash
openclaw gateway call facetime.setup --json
openclaw gateway call facetime.preflight --json
```

Runtime flags such as `audioReady`, `realtimeActive`,
`processInputVerified`, and `processOutputSuppressed` describe internal stages.
They do not prove that a remote participant heard audio. Only a consensual live
round trip can prove remote audibility, and no such call is run automatically.

## Verify your first call

1. Obtain the participant's consent and confirm no call or dial is already active.
2. Ask your agent to call one of the configured owner handles using `facetime_call`
   and approve the exact outgoing call. Start with FaceTime Audio.
3. Answer and wait for the greeting before speaking. Confirm that you hear it on
   the receiving device, not just the Gateway Mac's speakers.
4. Ask a simple question, then a read-only tool question such as your calendar.
   Wait for the actual answer; an acknowledgement such as "one sec" is not success.
5. Ask to hang up, then check `facetime.status` for no active or pending call.

Do not treat a successful preflight as a successful call. Record greeting,
two-way audio, the tool-backed answer, and closure separately. Obtain fresh
consent before calling again.

## Place and end calls

```bash
openclaw gateway call facetime.dial \
  --params '{"handle":"owner@example.com","mode":"audio"}' \
  --json

openclaw gateway call facetime.hangup --json
```

The caller-generated dial identity remains in the helper's process-local
correlation state and plugin SQLite state. It is not stamped into Apple's call
object. After Gateway restart, the plugin adopts only a call correlated by the
exact persisted dial identity, UUID alias, or proxy identity.

Hangup acknowledgement means only that termination was requested. The plugin
keeps local suppression until a native ended event or stable complete-topology
absence proves closure. On shutdown or capture loss, unproven closure escalates
to the exact authenticated carrier process before the tap is released.

## Remove the integration

Use the explicit admin uninstall, then follow the app-restart and SIP recovery
steps in [FaceTime recovery and removal](/plugins/facetime-recovery):

```bash
openclaw gateway call facetime.uninstall --json
```

## Limits

- one managed call at a time
- FaceTime video and Phone-owned FaceTime Audio require separate live proof
- private numeric call statuses use one versioned mapping; unknown states fail closed
- playback drain is a host-side timing estimate after PCM reaches SoX; it does not prove Core Audio consumption or remote delivery
- no FaceTime-specific realtime-model fallback; the selected provider owns its defaults
- tool-backed answers can take substantially longer than greetings; consult latency remains an experimental limitation
- successful calls on one configured Mac do not establish clean-install or repeat-call reliability

## Troubleshooting

| Symptom                                                          | Check                                                                                                                                         |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Voice changes unexpectedly                                       | Set `realtime.provider` explicitly and check that provider's credentials. Pin a supported `voice` if you do not want its default.             |
| Greeting works but calendar fails                                | Verify the selected agent's calendar tool and authentication. Voice credentials and calendar credentials are separate.                        |
| "One sec" followed by a long wait                                | Inspect Gateway and agent-session timings. Separate agent/model turns from calendar-tool execution; do not redial while the call is active.   |
| No greeting or audio comes from the Mac                          | Check FaceTime/Phone microphone selection, physical output, setup and preflight results. Internal audio flags do not prove remote audibility. |
| Missing helper, failed signature check, or incompatible protocol | Install the matching signed native release. Do not bypass signature checks or substitute an arbitrary local build.                            |
| Incomplete helper topology or unknown native status              | Check `facetime.status` for closure, then inspect the exact setup/preflight failure. Do not repeatedly dial or weaken carrier checks.         |
| Xcode trust or driver installation fails                         | Follow [FaceTime recovery and removal](/plugins/facetime-recovery#recover-a-failed-driver-update).                                            |

Use [Gateway logs](/logging) and [session inspection](/cli/sessions) to diagnose
failures. Remove phone numbers, calendar contents, credentials, and private
transcripts before sharing evidence.

## Related

- [Configuration reference](/plugins/reference/facetime)
- [FaceTime recovery and removal](/plugins/facetime-recovery)
- [Plugin management](/plugins/manage-plugins)
- [Secrets](/gateway/secrets)
