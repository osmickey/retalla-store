import Icon from '../icons/Icon';
import { POPULAR_SEARCHES } from '../lib/config';

// Shared by SearchPanel's live-typing dropdown and ShopPage's submitted-search
// results, so a "no results" moment looks and behaves identically regardless
// of which of the two search entry points produced it.
export default function NoResultsState({ query, onPopularSearch, pillCount = 3 }) {
  return (
    <div className="search-no-results">
      <div className="icon-circle search-no-results-icon">
        <Icon name="search" size={24} />
      </div>
      <p>
        No results for “<em>{query}</em>”
      </p>
      <div className="search-pills">
        {POPULAR_SEARCHES.slice(0, pillCount).map((term) => (
          <button key={term} type="button" className="search-pill" onClick={() => onPopularSearch(term)}>
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
