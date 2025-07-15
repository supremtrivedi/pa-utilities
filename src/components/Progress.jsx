function Progress({ text, percentage }) {
  return (
    <div className="progress-container">
      <progress value={percentage} max="100">
        {percentage}%
      </progress>
      <p className="progress-text">{text} ({percentage}%)</p>
    </div>
  );
}

export default Progress;
