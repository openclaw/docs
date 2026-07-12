---
summary: Điểm đánh giá mức độ sẵn sàng phát hành của OpenClaw cho các lĩnh vực sản phẩm, phần tích hợp và quy trình làm việc được hỗ trợ.
title: Bảng điểm mức độ trưởng thành
x-i18n:
    generated_at: "2026-07-12T08:04:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# Bảng điểm mức độ trưởng thành

<div className="maturity-hero">
  <p className="maturity-kicker">mức độ sẵn sàng phát hành - được tạo từ hệ thống phân loại + bằng chứng QA</p>
  <p className="maturity-hero-title">Góc nhìn thực tiễn về những gì đã sẵn sàng, đã được chứng minh và vẫn cần hoàn thiện.</p>
  <p>50 bề mặt - 281 lĩnh vực năng lực - phạm vi kiểm thử có tính xác định cùng chất lượng và mức độ hoàn thiện được con người đánh giá.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">Duyệt các bề mặt</a> / <a href="#qa-evidence-summary">Kiểm tra bằng chứng QA</a> / <a href="/vi/maturity/taxonomy">Đọc hệ thống phân loại</a></p>
</div>

## Mục đích của trang này

Hãy sử dụng trang này để trả lời một câu hỏi: những bề mặt OpenClaw nào là lựa chọn đáng tin cậy cho một bản phát hành và bằng chứng nào hỗ trợ nhận định đó? Phạm vi kiểm thử được xác định từ bằng chứng QA có tính xác định; chất lượng và mức độ hoàn thiện được duy trì dưới dạng điểm trưởng thành đã qua đánh giá.

## Tổng quan

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>Điểm trưởng thành</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Alpha</span>
      <span>Chất lượng + mức độ hoàn thiện</span>
      <span>Phạm vi kiểm thử Thử nghiệm - 4%</span>
      <span>Chất lượng Alpha - 64%</span>
      <span>Mức độ hoàn thiện Beta - 71%</span>
    </div>
  </div>
</div>

Phạm vi kiểm thử được chủ đích dẫn dắt bởi bằng chứng: một lĩnh vực không trở nên "sẵn sàng" chỉ vì phần triển khai đã tồn tại. Đây không phải là dữ liệu đầu vào của điểm trưởng thành, nhưng OpenClaw đặt mục tiêu duy trì phạm vi kiểm thử đầu cuối trên 90% theo thời gian đối với các tính năng trưởng thành ở cấp Ổn định hoặc cao hơn.

## Các khoảng điểm

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Alpha</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Beta</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">Ổn định</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## Trình khám phá bề mặt

<a id="surface-explorer" />

Các bề mặt được sắp xếp theo mức độ trưởng thành, mức độ hoàn thiện và chất lượng. Trạng thái hỗ trợ LTS được hiển thị bên cạnh từng hàng để có thể dễ dàng so sánh các lựa chọn sẵn sàng phát hành.

  <Tabs>
  <Tab title="Tất cả bề mặt">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Bề mặt</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Hỗ trợ</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>7 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Môi trường chạy Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>13 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Máy chủ Gateway Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">Máy chủ Gateway macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>7 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#android-app"><span className="maturity-surface-title">Ứng dụng Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>7 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#ios-app"><span className="maturity-surface-title">Ứng dụng iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>8 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Môi trường thực thi tác tử</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Công cụ phiên, bộ nhớ và ngữ cảnh</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Khung kênh</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Các công cụ tự động hóa trình duyệt, thực thi và hộp cát</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#observability"><span className="maturity-surface-title">Khả năng quan sát</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Đường dẫn nhà cung cấp OpenAI và Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Ứng dụng web Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Công cụ tìm kiếm web</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#plugins"><span className="maturity-surface-title">Các Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Bảo mật, xác thực, ghép đôi và bí mật</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Tự động hóa: Cron, hook, tác vụ, thăm dò</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Lưu trữ bằng Docker và Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows qua WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi và các thiết bị Linux nhỏ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Luồng nhà cung cấp Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Đầy đủ - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Đầy đủ - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Luồng nhà cung cấp Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage và BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">Ứng dụng đồng hành trên macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Luồng nhà cung cấp OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Hiểu và tạo nội dung đa phương tiện</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Công cụ tạo hình ảnh, video và âm nhạc</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Nhà cung cấp mô hình cục bộ: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Các nhà cung cấp dịch vụ lưu trữ ít phổ biến</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>3 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Thoại và trò chuyện theo thời gian thực</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows nguyên bản</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Lưu trữ trên Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, các kênh khu vực</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">SDK ứng dụng OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Quy trình cài đặt Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Thử nghiệm</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Kênh cuộc gọi thoại</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Thử nghiệm</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Các giao diện đồng hành trên watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Thử nghiệm</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Ứng dụng đồng hành cho Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Đã lên kế hoạch</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Ứng dụng đồng hành gốc cho Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Đã lên kế hoạch</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Lõi">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Bề mặt</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Độ hoàn thiện</span><span>Hỗ trợ</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>7 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ hoàn thiện</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Môi trường thực thi Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>13 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ hoàn thiện</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Môi trường thực thi tác tử</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Bộ máy phiên, bộ nhớ và ngữ cảnh</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Khung kênh</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#observability"><span className="maturity-surface-title">Khả năng quan sát</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Ứng dụng web Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#plugins"><span className="maturity-surface-title">Các Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Bảo mật, xác thực, ghép nối và bí mật</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Tự động hóa: Cron, hook, tác vụ, thăm dò</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Hiểu và tạo nội dung đa phương tiện</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Thoại và trò chuyện theo thời gian thực</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">SDK ứng dụng OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Nền tảng">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Bề mặt</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Hỗ trợ</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Máy chủ Gateway Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">Máy chủ Gateway macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>7 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#android-app"><span className="maturity-surface-title">Ứng dụng Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>7 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#ios-app"><span className="maturity-surface-title">Ứng dụng iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>8 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Lưu trữ bằng Docker và Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows qua WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi và các thiết bị Linux nhỏ gọn</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">Ứng dụng đồng hành trên macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows nguyên bản</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Lưu trữ bằng Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Phương thức cài đặt Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Thử nghiệm</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Các giao diện đồng hành trên watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Thử nghiệm</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Ứng dụng đồng hành cho Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Đã lên kế hoạch</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Ứng dụng đồng hành gốc cho Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Đã lên kế hoạch</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Kênh">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Bề mặt</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Hỗ trợ</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Đầy đủ - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Đầy đủ - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage và BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, các kênh khu vực</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Kênh cuộc gọi thoại</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Thử nghiệm</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Nhà cung cấp và công cụ">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Hạng mục</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Hỗ trợ</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Công cụ tự động hóa trình duyệt, exec và sandbox</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Luồng nhà cung cấp OpenAI và Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Một phần - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Công cụ tìm kiếm trên web</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Lộ trình nhà cung cấp Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Lộ trình nhà cung cấp Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Lộ trình nhà cung cấp OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Công cụ tạo hình ảnh, video và âm nhạc</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Nhà cung cấp mô hình cục bộ: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/vi/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Các nhà cung cấp dịch vụ lưu trữ ít phổ biến</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>3 lĩnh vực</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Độ bao phủ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Chất lượng</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Mức độ hoàn thiện</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Không có</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## Tóm tắt bằng chứng QA

Các lượt kiểm tra dưới đây cho biết những lĩnh vực nào trong bảng điểm đã được kiểm chứng bằng bằng chứng từ hồ sơ QA.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">Xác thực toàn bộ hệ thống phân loại</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 lượt kiểm tra - 94 đạt, 2 bị chặn</span>
    <span>0 trên 281 (0%) lĩnh vực - 20 trên 1675 (1.2%) tính năng - 77 trên 1665 (4.6%) ID phạm vi kiểm thử</span>
  </div>
</div>

### Mức độ sẵn sàng theo lĩnh vực

  Mở một mục để kiểm tra trạng thái bằng chứng của từng danh mục. Danh sách được giữ ở trạng thái thu gọn để trang vẫn dễ xem nhanh.

  <AccordionGroup>
  <Accordion title="Môi trường thực thi tác tử - 9 lĩnh vực">
    <p className="maturity-readiness-summary">8 đã được đánh giá một phần / 1 cần đánh giá</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thực thi lượt tác tử</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được đánh giá một phần - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 7 trên 24 (29.2%)</span>
        <span>17 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Môi trường thực thi bên ngoài và tác tử phụ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được đánh giá một phần - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 3 trên 10 (30%)</span>
        <span>7 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thực thi qua nhà cung cấp được lưu trữ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được đánh giá một phần - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>1 trên 5 (20%) / 1 trên 5 (20%)</span>
        <span>4 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nhà cung cấp cục bộ và tự lưu trữ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lựa chọn mô hình và môi trường thực thi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được đánh giá một phần - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 2 trên 8 (25%)</span>
        <span>6 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Xác thực nhà cung cấp</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được đánh giá một phần - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 4 trên 17 (23.5%)</span>
        <span>13 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Truyền phát và tiến độ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được đánh giá một phần - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 5 trên 9 (55.6%)</span>
        <span>4 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lệnh gọi công cụ và xử lý phản hồi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được đánh giá một phần - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 15 trên 23 (65.2%)</span>
        <span>8 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kiểm soát thực thi công cụ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được đánh giá một phần - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 6 trên 12 (50%)</span>
        <span>6 khoảng trống năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ứng dụng Android - 7 lĩnh vực">
    <p className="maturity-readiness-summary">7 cần đánh giá</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập kết nối</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Môi trường thực thi trên thiết bị</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phân phối</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thu nhận nội dung đa phương tiện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trò chuyện trên thiết bị di động</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cài đặt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Giọng nói</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Luồng nhà cung cấp Anthropic - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 cần đánh giá</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Đầu vào đa phương tiện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lựa chọn mô hình và môi trường thực thi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 12 (0%)</span>
        <span>12 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bộ nhớ đệm lời nhắc và ngữ cảnh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Xác thực và khôi phục nhà cung cấp</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 9 (0%) / 0 trên 9 (0%)</span>
        <span>9 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Truyền tải yêu cầu và ngữ nghĩa lượt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực đầy đủ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 khoảng trống năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Tự động hóa: Cron, hook, tác vụ, thăm dò - 6 lĩnh vực">
    <p className="maturity-readiness-summary">5 cần xem xét / 1 đã xem xét một phần</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hook tự động hóa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 11 (0%) / 0 trên 11 (0%)</span>
        <span>11 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tác vụ và luồng chạy nền</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tác vụ Cron</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 15 (0%) / 0 trên 15 (0%)</span>
        <span>15 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tiếp nhận sự kiện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 15 (0%) / 0 trên 15 (0%)</span>
        <span>15 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 1 trên 7 (14.3%)</span>
        <span>6 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Điều khiển thăm dò</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Tự động hóa trình duyệt, thực thi và công cụ hộp cát - 3 lĩnh vực">
    <p className="maturity-readiness-summary">2 đã xem xét một phần / 1 cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tự động hóa trình duyệt</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>1 trên 8 (12.5%) / 1 trên 8 (12.5%)</span>
        <span>7 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chính sách hộp cát và công cụ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gọi và thực thi công cụ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>2 trên 6 (33.3%) / 4 trên 8 (50%)</span>
        <span>4 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ứng dụng web Gateway - 6 lĩnh vực">
    <p className="maturity-readiness-summary">3 cần xem xét / 3 đã xem xét một phần</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền truy cập và độ tin cậy của trình duyệt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trò chuyện thời gian thực trên trình duyệt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Giao diện người dùng trên trình duyệt</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 1 trên 12 (8.3%)</span>
        <span>11 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cấu hình</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bảng điều khiển vận hành</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 1 trên 12 (8.3%)</span>
        <span>11 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cuộc hội thoại WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 15 (0%) / 2 trên 20 (10%)</span>
        <span>18 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Khung kênh - 8 lĩnh vực">
    <p className="maturity-readiness-summary">4 cần xem xét / 4 đã xem xét một phần</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hành động, lệnh và phê duyệt của kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 1 trên 7 (14.3%)</span>
        <span>6 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến và phân phối cuộc hội thoại</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 5 trên 27 (18.5%)</span>
        <span>22 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hành vi của luồng nhóm và phòng chung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 4 trên 11 (36.4%)</span>
        <span>7 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cổng kiểm soát quyền truy cập và danh tính đầu vào</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tệp đính kèm đa phương tiện và dữ liệu kênh phong phú</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quy trình phân phối đầu ra và phản hồi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 8 trên 21 (38.1%)</span>
        <span>13 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tình trạng sức khỏe và điều khiển vận hành</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 lĩnh vực">
    <p className="maturity-readiness-summary">4 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Khám phá danh mục</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Khả năng tương thích và độ tin cậy</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 12 (0%) / 0 trên 12 (0%)</span>
        <span>12 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Vòng đời và tình trạng của Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 26 (0%) / 0 trên 26 (0%)</span>
        <span>26 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phát hành</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét / 2 lĩnh vực đã được xem xét một phần</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Khả năng quan sát CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>1 trên 6 (16.7%) / 1 trên 6 (16.7%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chẩn đoán</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quản lý dịch vụ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 1 trên 7 (14.3%)</span>
        <span>6 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hướng dẫn ban đầu và thiết lập xác thực</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập Plugin và kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cập nhật và nâng cấp</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 lĩnh vực">
    <p className="maturity-readiness-summary">6 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền truy cập và danh tính</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và vận hành kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến và chuyển phát cuộc trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 12 (0%) / 0 trên 12 (0%)</span>
        <span>12 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phương tiện và nội dung đa dạng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Điều khiển gốc và phê duyệt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thoại và cuộc gọi theo thời gian thực</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Lưu trữ bằng Docker và Podman - 4 lĩnh vực">
    <p className="maturity-readiness-summary">3 lĩnh vực cần xem xét / 1 lĩnh vực đã được xem xét một phần</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Môi trường cách ly và công cụ cho tác nhân</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Vận hành vùng chứa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 11 (0%) / 0 trên 11 (0%)</span>
        <span>11 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập vùng chứa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phát hành và xác thực ảnh</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>1 trên 5 (20%) / 2 trên 7 (28.6%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, các kênh khu vực - 4 lĩnh vực">
    <p className="maturity-readiness-summary">4 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền truy cập và danh tính</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và vận hành kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phương tiện và nội dung đa dạng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Môi trường thực thi Gateway - 13 lĩnh vực">
    <p className="maturity-readiness-summary">9 lĩnh vực cần xem xét / 4 lĩnh vực đã được xem xét một phần</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phê duyệt và thực thi từ xa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Xác thực và ghép nối thiết bị</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Vòng đời Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 4 trên 12 (33.3%)</span>
        <span>8 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API RPC và sự kiện của Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 20 (0%) / 2 trên 22 (9.1%)</span>
        <span>20 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tình trạng, chẩn đoán và sửa chữa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Giao diện web được lưu trữ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API HTTP</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>1 trên 4 (25%) / 1 trên 4 (25%)</span>
        <span>3 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Truy cập và khám phá mạng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Các Node và năng lực từ xa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 8 (0%) / 0 trên 8 (0%)</span>
        <span>8 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Khả năng tương thích giao thức</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Vai trò và quyền hạn</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kiểm soát bảo mật</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kết nối WebSocket</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>1 trên 8 (12.5%) / 1 trên 8 (12.5%)</span>
        <span>7 khoảng trống năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền truy cập và danh tính</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 11 (0%) / 0 trên 11 (0%)</span>
        <span>11 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và vận hành kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 16 (0%) / 0 trên 16 (0%)</span>
        <span>16 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phương tiện và nội dung đa dạng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Điều khiển gốc và phê duyệt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 16 (0%) / 0 trên 16 (0%)</span>
        <span>16 khoảng trống năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Lộ trình nhà cung cấp Google - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Môi trường thực thi Gemini trực tiếp</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 9 (0%) / 0 trên 9 (0%)</span>
        <span>9 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phương tiện, tìm kiếm và thời gian thực</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến mô hình và điểm cuối</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lưu bộ nhớ đệm lời nhắc</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập nhà cung cấp và thông tin xác thực</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 thiếu sót về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Công cụ tạo hình ảnh, video và âm nhạc - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tạo hình ảnh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 9 (0%) / 0 trên 9 (0%)</span>
        <span>9 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến và khám phá phương tiện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tạo âm nhạc</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Vòng đời tác vụ và phân phối</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 12 (0%) / 0 trên 12 (0%)</span>
        <span>12 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tạo video</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 11 (0%) / 0 trên 11 (0%)</span>
        <span>11 thiếu sót về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage và BlueBubbles - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền truy cập và danh tính</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và vận hành kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 11 (0%) / 0 trên 11 (0%)</span>
        <span>11 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phương tiện và nội dung đa dạng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Điều khiển và phê duyệt gốc</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 thiếu sót về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ứng dụng iOS - 8 lĩnh vực">
    <p className="maturity-readiness-summary">8 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Khung vẽ và màn hình</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trò chuyện và phiên</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lệnh thiết bị</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phân phối</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và chẩn đoán Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phương tiện và chia sẻ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thông báo và hoạt động nền</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 thiếu sót về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Giọng nói</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 thiếu sót về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Lưu trữ trên Kubernetes - 4 lĩnh vực">
    <p className="maturity-readiness-summary">4 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Truy cập và công khai</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Vòng đời cụm</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cấu hình và thông tin bí mật</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập triển khai</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ứng dụng đồng hành trên Linux - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phân phối ứng dụng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trò chuyện và phiên</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Năng lực máy tính để bàn</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 9 (0%) / 0 trên 9 (0%)</span>
        <span>9 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Khả năng kết nối với Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trạng thái và chẩn đoán</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Máy chủ Gateway trên Linux - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mục tiêu triển khai</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chẩn đoán và sửa chữa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Môi trường chạy Gateway và điều khiển dịch vụ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và cập nhật máy chủ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Truy cập từ xa và bảo mật</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Nhà cung cấp mô hình cục bộ: Ollama, vLLM, SGLang, LM Studio - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bộ nhớ cục bộ và phép nhúng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin nhà cung cấp gốc</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">An toàn mạng và kiểm soát lời nhắc</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Khả năng tương thích với môi trường chạy tương thích OpenAI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 8 (0%) / 0 trên 8 (0%)</span>
        <span>8 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập, vòng đời và chẩn đoán nhà cung cấp</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 12 (0%) / 0 trên 12 (0%)</span>
        <span>12 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Các nhà cung cấp dịch vụ lưu trữ ít phổ biến - 3 lĩnh vực">
    <p className="maturity-readiness-summary">3 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nhà cung cấp LLM được lưu trữ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 12 (0%) / 0 trên 12 (0%)</span>
        <span>12 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nhà cung cấp phương tiện được lưu trữ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 8 (0%) / 0 trên 8 (0%)</span>
        <span>8 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Vận hành nhà cung cấp</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 12 (0%) / 0 trên 12 (0%)</span>
        <span>12 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ứng dụng đồng hành macOS - 8 lĩnh vực">
    <p className="maturity-readiness-summary">8 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi kiểm thử</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Không gian vẽ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập cục bộ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Năng lực gốc</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kết nối từ xa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat từ xa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trạng thái và cài đặt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Giọng nói và trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Máy chủ Gateway trên macOS - 7 lĩnh vực">
    <p className="maturity-readiness-summary">7 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi kiểm thử</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chẩn đoán và khả năng quan sát</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Vòng đời dịch vụ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tích hợp Gateway cục bộ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 9 (0%) / 0 trên 9 (0%)</span>
        <span>9 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền và năng lực gốc</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hồ sơ và cách ly</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chế độ Gateway từ xa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 lĩnh vực">
    <p className="maturity-readiness-summary">6 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi kiểm thử</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền truy cập và danh tính</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và vận hành kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mã hóa và xác minh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nội dung đa phương tiện và phong phú</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Điều khiển gốc và phê duyệt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - 4 lĩnh vực">
    <p className="maturity-readiness-summary">4 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền truy cập và danh tính</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và vận hành kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phương tiện và nội dung đa dạng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Nhận hiểu và tạo phương tiện - 6 lĩnh vực">
    <p className="maturity-readiness-summary">4 lĩnh vực cần xem xét / 2 lĩnh vực đã được xem xét một phần</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Xử lý phương tiện trên kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cấu hình phương tiện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tạo phương tiện</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>1 trên 17 (5.9%) / 1 trên 19 (5.3%)</span>
        <span>18 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tiếp nhận và truy cập phương tiện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 8 (0%) / 0 trên 8 (0%)</span>
        <span>8 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nhận hiểu phương tiện</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 12 (0%) / 1 trên 14 (7.1%)</span>
        <span>13 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phân phối văn bản thành giọng nói</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 khoảng trống năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền truy cập và danh tính</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 9 (0%) / 0 trên 9 (0%)</span>
        <span>9 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và vận hành kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 9 (0%) / 0 trên 9 (0%)</span>
        <span>9 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phương tiện và nội dung đa dạng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Điều khiển và phê duyệt gốc</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows nguyên bản - 4 lĩnh vực">
    <p className="maturity-readiness-summary">4 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 9 (0%) / 0 trên 9 (0%)</span>
        <span>9 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quản lý Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 11 (0%) / 0 trên 11 (0%)</span>
        <span>11 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kết nối mạng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bản cập nhật</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Ứng dụng đồng hành Windows gốc - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phiên trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Công cụ và quyền trên máy tính</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kết nối Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cài đặt và cập nhật</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trạng thái và sửa chữa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Đường dẫn cài đặt Nix - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kích hoạt và trải nghiệm người dùng của ứng dụng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cấu hình và trạng thái</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bàn giao quá trình cài đặt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Vòng đời Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Môi trường chạy dịch vụ và cơ chế bảo vệ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 8 (0%) / 0 trên 8 (0%)</span>
        <span>8 khoảng trống năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Đường dẫn nhà cung cấp OpenAI và Codex - 5 lĩnh vực">
    <p className="maturity-readiness-summary">2 lĩnh vực cần xem xét / 3 lĩnh vực đã được xem xét một phần</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Đầu vào hình ảnh và đa phương thức</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mô hình và xác thực</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>1 trên 6 (16.7%) / 4 trên 9 (44.4%)</span>
        <span>5 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bộ khung Codex gốc</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 4 trên 9 (44.4%)</span>
        <span>5 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Khả năng tương thích của phản hồi và công cụ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>1 trên 4 (25%) / 2 trên 5 (40%)</span>
        <span>3 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Giọng nói và âm thanh thời gian thực</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 khoảng trống năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="SDK ứng dụng OpenClaw - 6 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét / 1 lĩnh vực đã được xem xét một phần</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cuộc hội thoại của tác nhân</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API máy khách</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Khả năng tương thích</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sự kiện và phê duyệt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền truy cập Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tiện ích hỗ trợ tài nguyên</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 1 trên 6 (16.7%)</span>
        <span>5 khoảng trống năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Đường dẫn nhà cung cấp OpenRouter - 4 lĩnh vực">
    <p className="maturity-readiness-summary">4 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Công việc tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Môi trường thực thi trò chuyện và chuẩn hóa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 15 (0%) / 0 trên 15 (0%)</span>
        <span>15 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tạo nội dung đa phương tiện và giọng nói</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Khôi phục và chẩn đoán nhà cung cấp</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và xác thực nhà cung cấp</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 14 (0%) / 0 trên 14 (0%)</span>
        <span>14 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugin - 9 lĩnh vực">
    <p className="maturity-readiness-summary">6 lĩnh vực cần xem xét / 3 lĩnh vực đã được xem xét một phần</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Công việc tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phát triển và đóng gói Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 8 (0%) / 0 trên 8 (0%)</span>
        <span>8 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin đi kèm</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cài đặt và chạy Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 7 trên 20 (35%)</span>
        <span>13 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phê duyệt Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin nhà cung cấp và công cụ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>1 trên 6 (16.7%) / 9 trên 21 (42.9%)</span>
        <span>12 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phát hành Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kiểm thử Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 3 trên 11 (27.3%)</span>
        <span>8 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi và các thiết bị Linux cỡ nhỏ - 4 lĩnh vực">
    <p className="maturity-readiness-summary">4 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Công việc tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Môi trường thực thi Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hiệu năng và chẩn đoán</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Truy cập từ xa và xác thực</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 9 (0%) / 0 trên 9 (0%)</span>
        <span>9 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và khả năng tương thích</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 12 (0%) / 0 trên 12 (0%)</span>
        <span>12 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Bảo mật, xác thực, ghép nối và bí mật - 6 lĩnh vực">
    <p className="maturity-readiness-summary">2 lĩnh vực đã được xem xét một phần / 4 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Công việc tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chính sách phê duyệt và biện pháp bảo vệ công cụ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 3 trên 6 (50%)</span>
        <span>3 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kiểm soát truy cập kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quản lý an toàn thông tin xác thực và bí mật</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 5 trên 11 (45.5%)</span>
        <span>6 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ghép nối thiết bị và Node</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 11 (0%) / 0 trên 11 (0%)</span>
        <span>11 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Xác thực Gateway và truy cập từ xa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 9 (0%) / 0 trên 9 (0%)</span>
        <span>9 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Độ tin cậy của Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Phiên, bộ nhớ và công cụ ngữ cảnh - 9 lĩnh vực">
    <p className="maturity-readiness-summary">2 cần xem xét / 7 đã được xem xét một phần</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quản lý phiên và bản ghi hội thoại trong CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Công cụ ngữ cảnh</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 4 trên 7 (57.1%)</span>
        <span>3 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lời nhắc và ngữ cảnh cốt lõi</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 3 trên 8 (37.5%)</span>
        <span>5 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tính tương đương về lịch sử và phiên giữa các ứng dụng khách</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 2 trên 5 (40%)</span>
        <span>3 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chẩn đoán, bảo trì và khôi phục</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 4 trên 10 (40%)</span>
        <span>6 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bộ nhớ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 6 trên 13 (46.2%)</span>
        <span>7 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến phiên</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 1 trên 4 (25%)</span>
        <span>3 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quản lý token</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 2 trên 10 (20%)</span>
        <span>8 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lưu giữ bản ghi hội thoại</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền truy cập và danh tính</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và vận hành kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phương tiện và nội dung đa dạng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Điều khiển và phê duyệt gốc</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền truy cập và danh tính</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và vận hành kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phương tiện và nội dung đa dạng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Điều khiển và phê duyệt gốc</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 8 (0%) / 0 trên 8 (0%)</span>
        <span>8 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / ID phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền truy cập và danh tính</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và vận hành kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phương tiện và nội dung đa dạng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Điều khiển và phê duyệt gốc</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 9 (0%) / 0 trên 9 (0%)</span>
        <span>9 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Khả năng quan sát - 5 lĩnh vực">
    <p className="maturity-readiness-summary">3 đã được đánh giá một phần / 2 cần đánh giá</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thu thập dữ liệu chẩn đoán</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được đánh giá một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>1 trên 8 (12.5%) / 3 trên 10 (30%)</span>
        <span>7 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tình trạng và khắc phục</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được đánh giá một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>1 trên 12 (8.3%) / 5 trên 18 (27.8%)</span>
        <span>13 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ghi nhật ký</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chẩn đoán phiên</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Xuất dữ liệu đo từ xa</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được đánh giá một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>1 trên 13 (7.7%) / 7 trên 21 (33.3%)</span>
        <span>14 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 cần đánh giá</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Đầu vào và lệnh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 8 (0%) / 0 trên 8 (0%)</span>
        <span>8 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thực thi shell cục bộ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kết xuất và an toàn đầu ra</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chế độ thời gian chạy</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 14 (0%) / 0 trên 14 (0%)</span>
        <span>14 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quản lý phiên</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Thoại và trò chuyện thời gian thực - 6 lĩnh vực">
    <p className="maturity-readiness-summary">6 cần đánh giá</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trò chuyện trong ứng dụng gốc</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phiên trò chuyện thời gian thực</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 11 (0%) / 0 trên 11 (0%)</span>
        <span>11 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Giọng nói và phiên âm</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Khả năng quan sát cuộc trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nhà cung cấp dịch vụ trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Đánh thức bằng giọng nói và định tuyến</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Kênh cuộc gọi thoại - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 cần đánh giá</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền truy cập và danh tính</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và vận hành kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến và phân phối cuộc hội thoại</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 1 (0%) / 0 trên 1 (0%)</span>
        <span>1 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phương tiện và nội dung đa dạng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 khoảng trống về khả năng</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thoại và cuộc gọi thời gian thực</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần đánh giá - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 khoảng trống về khả năng</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Các bề mặt ứng dụng đồng hành watchOS - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phân phối và khôi phục</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phát hành và hỗ trợ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Phê duyệt thực thi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thông báo và phản hồi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Giao diện người dùng của ứng dụng trên đồng hồ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 3 (0%) / 0 trên 3 (0%)</span>
        <span>3 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Công cụ tìm kiếm trên web - 4 lĩnh vực">
    <p className="maturity-readiness-summary">2 lĩnh vực cần xem xét / 2 lĩnh vực đã được xem xét một phần</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">An toàn mạng</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nhà cung cấp dịch vụ tìm kiếm</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>2 trên 19 (10.5%) / 2 trên 19 (10.5%)</span>
        <span>17 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và chẩn đoán</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 9 (0%) / 0 trên 9 (0%)</span>
        <span>9 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tính khả dụng và khả năng truy xuất của công cụ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>2 trên 11 (18.2%) / 3 trên 12 (25%)</span>
        <span>9 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Quyền truy cập và danh tính</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 7 (0%) / 0 trên 7 (0%)</span>
        <span>7 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập và vận hành kênh</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 5 (0%) / 0 trên 5 (0%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 4 (0%) / 0 trên 4 (0%)</span>
        <span>4 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nội dung đa phương tiện và nội dung phong phú</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Điều khiển và phê duyệt gốc</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 2 (0%) / 0 trên 2 (0%)</span>
        <span>2 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows qua WSL2 - 6 lĩnh vực">
    <p className="maturity-readiness-summary">5 lĩnh vực cần xem xét / 1 lĩnh vực đã được xem xét một phần</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Lĩnh vực</span><span>Tính năng / mã phạm vi bao phủ</span><span>Việc cần làm tiếp theo</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trình duyệt và giao diện người dùng điều khiển</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 8 (0%) / 0 trên 8 (0%)</span>
        <span>8 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chẩn đoán và sửa chữa</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Đã được xem xét một phần - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>1 trên 6 (16.7%) / 3 trên 8 (37.5%)</span>
        <span>5 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Truy cập và công khai Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 11 (0%) / 0 trên 11 (0%)</span>
        <span>11 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Vòng đời dịch vụ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 10 (0%) / 0 trên 10 (0%)</span>
        <span>10 khoảng trống về năng lực</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Thiết lập WSL</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Cần xem xét - Xác thực toàn bộ hệ thống phân loại</span>
        </div>
        <span>0 trên 6 (0%) / 0 trên 6 (0%)</span>
        <span>6 khoảng trống về năng lực</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> Cập nhật lần cuối: 2026-06-22
