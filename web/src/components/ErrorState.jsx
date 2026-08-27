import Icon from '../icons/Icon';

// Shared by every "a fetch actually failed" spot in the app -- as opposed to
// "the result is genuinely empty", which stays each page's own .empty-state.
// Reuses .app-modal-icon.error's exact colors via .icon-circle-danger rather
// than introducing a new token.
export default function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
  retryLabel = 'Retry',
  secondaryAction, // optional: { label, href } | { label, onClick }
  className = '',
}) {
  return (
    <div className={`empty-state error-state ${className}`.trim()}>
      <div className="icon-circle icon-circle-danger">
        <Icon name="alert" size={26} />
      </div>
      <p>{message}</p>
      {(onRetry || secondaryAction) && (
        <div className="empty-state-actions">
          {onRetry && (
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              {retryLabel}
            </button>
          )}
          {secondaryAction &&
            (secondaryAction.href ? (
              <a className="btn btn-outline" href={secondaryAction.href}>
                {secondaryAction.label}
              </a>
            ) : (
              <button type="button" className="btn btn-outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
