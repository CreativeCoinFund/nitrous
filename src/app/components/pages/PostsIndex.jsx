/* eslint react/prop-types: 0 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import tt from 'counterpart';
import { List } from 'immutable';
import { actions as fetchDataSagaActions } from 'app/redux/FetchDataSaga';
import constants from 'app/redux/constants';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import PostsList from 'app/components/cards/PostsList';
import { isFetchingOrRecentlyUpdated } from 'app/utils/StateFunctions';
import Callout from 'app/components/elements/Callout';
import SidebarLinks from 'app/components/elements/SidebarLinks';
import SidebarNewUsers from 'app/components/elements/SidebarNewUsers';
import Notices from 'app/components/elements/Notices';
import SteemMarket from 'app/components/elements/SteemMarket';
import { GptUtils } from 'app/utils/GptUtils';
import GptAd from 'app/components/elements/GptAd';
import ArticleLayoutSelector from 'app/components/modules/ArticleLayoutSelector';
import Topics from './Topics';
import SortOrder from 'app/components/elements/SortOrder';

class PostsIndex extends React.Component {
    static propTypes = {
        discussions: PropTypes.object,
        feed_posts: PropTypes.object,
        status: PropTypes.object,
        routeParams: PropTypes.object,
        requestData: PropTypes.func,
        loading: PropTypes.bool,
        username: PropTypes.string,
        blogmode: PropTypes.bool,
        categories: PropTypes.object,
    };

    static defaultProps = {
        showSpam: false,
    };

    constructor() {
        super();
        this.state = {};
        this.loadMore = this.loadMore.bind(this);
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'PostsIndex');
    }

    componentDidUpdate(prevProps) {
        if (
            window.innerHeight &&
            window.innerHeight > 3000 &&
            prevProps.discussions !== this.props.discussions
        ) {
            this.refs.list.fetchIfNeeded();
        }
    }

    getPosts(order, category) {
        const topic_discussions = this.props.discussions.get(category || '');
        if (!topic_discussions) return null;
        return topic_discussions.get(order);
    }

    loadMore(last_post) {
        if (!last_post) return;
        let {
            accountname,
            category,
            order = constants.DEFAULT_SORT_ORDER,
        } = this.props.routeParams;
        if (category === 'feed') {
            accountname = order.slice(1);
            order = 'by_feed';
        }
        if (isFetchingOrRecentlyUpdated(this.props.status, order, category))
            return;
        const [author, permlink] = last_post.split('/');
        this.props.requestData({
            author,
            permlink,
            order,
            category,
            accountname,
        });
    }
    onShowSpam = () => {
        this.setState({ showSpam: !this.state.showSpam });
    };
    render() {
        let {
            category,
            order = constants.DEFAULT_SORT_ORDER,
        } = this.props.routeParams;

        const {
            categories,
            featured,
            promoted,
            gptBannedTags,
            topic,
            community,
        } = this.props;

        let allowAdsOnContent = true;
        allowAdsOnContent =
            this.props.gptEnabled &&
            !GptUtils.HasBannedTags([topic], gptBannedTags);

        let topics_order = order;
        let posts = [];
        let account_name = '';
        let emptyText = '';
        if (category === 'feed') {
            account_name = order.slice(1);
            order = 'by_feed';
            topics_order = 'trending';
            posts = this.props.feed_posts;
            const isMyAccount = this.props.username === account_name;
            if (isMyAccount) {
                emptyText = (
                    <div>
                        {tt('posts_index.empty_feed_1')}.<br />
                        <br />
                        {tt('posts_index.empty_feed_2')}.<br />
                        <br />
                        <Link to="/trending">
                            {tt('posts_index.empty_feed_3')}
                        </Link>
                        <br />
                        <Link to="/welcome">
                            {tt('posts_index.empty_feed_4')}
                        </Link>
                        <br />
                        <Link to="/faq.html">
                            {tt('posts_index.empty_feed_5')}
                        </Link>
                        <br />
                    </div>
                );
            } else {
                emptyText = (
                    <div>
                        {tt('user_profile.user_hasnt_followed_anything_yet', {
                            name: account_name,
                        })}
                    </div>
                );
            }
        } else {
            posts = this.getPosts(order, category);
            if (posts && posts.size === 0) {
                emptyText = (
                    <div>
                        {'No ' +
                            topics_order +
                            (category ? ' #' + category : '') +
                            ' posts found'}
                    </div>
                );
            }
        }

        function teamMembers(members) {
            return members.map((row, idx) => (
                <div key={idx} style={{ fontSize: '80%' }}>
                    <Link to={'/@' + row.get(0)}>{'@' + row.get(0)}</Link>
                    {' ['}
                    {row.get(1)}
                    {'] '}
                    {row.get(2) && (
                        <span className="affiliation">{row.get(2)}</span>
                    )}
                </div>
            ));
        }

        const status = this.props.status
            ? this.props.status.getIn([category || '', order])
            : null;
        const fetching = (status && status.fetching) || this.props.loading;
        const { showSpam } = this.state;

        // If we're at one of the four sort order routes without a tag filter,
        // use the translated string for that sort order, f.ex "trending"
        //
        // If you click on a tag while you're in a sort order route,
        // the title should be the translated string for that sort order
        // plus the tag string, f.ex "trending: blog"
        //
        // Logged-in:
        // At homepage (@user/feed) say "My feed"
        let page_title = 'Posts'; // sensible default here?
        if (category === 'feed') {
            if (account_name === this.props.username)
                page_title = tt('posts_index.my_feed');
            else
                page_title = tt('posts_index.accountnames_feed', {
                    account_name,
                });
        } else {
            if (community) {
                page_title = community.get('title');
            } else if (typeof category !== 'undefined') {
                page_title = '#' + category;
            } else {
                page_title = tt('g.all_tags');
            }
        }
        const layoutClass = this.props.blogmode
            ? ' layout-block'
            : ' layout-list';
        return (
            <div
                className={
                    'PostsIndex row' +
                    (fetching ? ' fetching' : '') +
                    layoutClass
                }
            >
                <article className="articles">
                    <div className="articles__header row">
                        <div className="small-6 medium-6 large-6 column">
                            <h1 className="articles__h1 articles__h1--no-wrap">
                                {page_title}{' '}
                                {typeof category !== 'undefined' &&
                                    category !== 'feed' && (
                                        <small>
                                            <Link to={'/' + order}>[x]</Link>
                                        </small>
                                    )}
                            </h1>
                            {community && (
                                <div style={{ fontSize: '80%', color: 'gray' }}>
                                    #{category}
                                </div>
                            )}
                            {!community &&
                                typeof category !== 'undefined' &&
                                category !== 'feed' && (
                                    <div
                                        style={{
                                            fontSize: '80%',
                                            color: 'gray',
                                        }}
                                    >
                                        unmoderated tag
                                    </div>
                                )}
                        </div>
                        {category != 'feed' && (
                            <div className="small-6 medium-5 large-5 column articles__header-select">
                                <SortOrder
                                    sortOrder={this.props.sortOrder}
                                    topic={this.props.topic}
                                    horizontal={false}
                                />
                            </div>
                        )}
                        <div className="medium-1 show-for-mq-medium column">
                            <ArticleLayoutSelector />
                        </div>
                    </div>
                    <hr className="articles__hr" />
                    {!fetching &&
                    (posts && !posts.size) &&
                    (featured && !featured.size) &&
                    (promoted && !promoted.size) ? (
                        <Callout>{emptyText}</Callout>
                    ) : (
                        <PostsList
                            ref="list"
                            posts={posts ? posts : List()}
                            loading={fetching}
                            anyPosts
                            category={category}
                            hideCategory={!!community}
                            loadMore={this.loadMore}
                            showFeatured
                            showPromoted
                            showSpam={showSpam}
                            allowAdsOnContent={allowAdsOnContent}
                        />
                    )}
                </article>

                <aside className="c-sidebar c-sidebar--right">
                    {community && (
                        <div className="c-sidebar__module">
                            <div className="c-sidebar__header">
                                <h3 className="c-sidebar__h3">
                                    {community.get('title')}
                                </h3>
                            </div>
                            <strong>Moderators</strong>
                            {teamMembers(community.get('team'))}
                            <strong>Properties</strong>
                            <pre style={{ fontSize: '75%' }}>
                                {JSON.stringify(community, null, 2)}
                            </pre>
                        </div>
                    )}
                    {this.props.isBrowser &&
                    !this.props.maybeLoggedIn &&
                    !this.props.username ? (
                        <SidebarNewUsers />
                    ) : (
                        this.props.isBrowser && (
                            <div>
                                {/* <SidebarStats steemPower={123} followers={23} reputation={62} />  */}
                                <SidebarLinks username={this.props.username} />
                            </div>
                        )
                    )}
                    <Notices notices={this.props.notices} />
                    <SteemMarket />
                    {this.props.gptEnabled && allowAdsOnContent ? (
                        <div className="sidebar-ad">
                            <GptAd type="Freestar" id="steemit_160x600_Right" />
                        </div>
                    ) : null}
                </aside>

                <aside className="c-sidebar c-sidebar--left">
                    <Topics
                        order={topics_order}
                        current={category}
                        compact={false}
                        username={this.props.username}
                        categories={categories}
                    />
                    <small>
                        <a
                            className="c-sidebar__more-link"
                            onClick={this.onShowSpam}
                        >
                            {showSpam
                                ? tt('g.next_3_strings_together.show_less')
                                : tt('g.next_3_strings_together.show_more')}
                        </a>
                        {' ' + tt('g.next_3_strings_together.value_posts')}
                    </small>
                    {this.props.gptEnabled && allowAdsOnContent ? (
                        <div>
                            <div className="sidebar-ad">
                                <GptAd
                                    type="Freestar"
                                    slotName="steemit_160x600_Left_1"
                                />
                            </div>
                            <div
                                className="sidebar-ad"
                                style={{ marginTop: 20 }}
                            >
                                <GptAd
                                    type="Freestar"
                                    slotName="steemit_160x600_Left_2"
                                />
                            </div>
                        </div>
                    ) : null}
                </aside>
            </div>
        );
    }
}

module.exports = {
    path: ':order(/:category)',
    component: connect(
        (state, ownProps) => {
            // special case if user feed (vs. trending, etc)
            let feed_posts;
            if (ownProps.routeParams.category === 'feed') {
                const account_name = ownProps.routeParams.order.slice(1);
                feed_posts = state.global.getIn([
                    'accounts',
                    account_name,
                    'feed',
                ]);
            }

            return {
                discussions: state.global.get('discussion_idx'),
                status: state.global.get('status'),
                loading: state.app.get('loading'),
                feed_posts,
                community: state.global.getIn(
                    ['community', ownProps.params.category],
                    null
                ),
                username:
                    state.user.getIn(['current', 'username']) ||
                    state.offchain.get('account'),
                blogmode: state.app.getIn(['user_preferences', 'blogmode']),
                sortOrder: ownProps.params.order,
                topic: ownProps.params.category,
                categories: state.global
                    .getIn(['tag_idx', 'trending'])
                    .take(50),
                featured: state.offchain
                    .get('special_posts')
                    .get('featured_posts'),
                promoted: state.offchain
                    .get('special_posts')
                    .get('promoted_posts'),
                notices: state.offchain
                    .get('special_posts')
                    .get('notices')
                    .toJS(),
                maybeLoggedIn: state.user.get('maybeLoggedIn'),
                isBrowser: process.env.BROWSER,
                gptEnabled: state.app.getIn(['googleAds', 'gptEnabled']),
                gptBannedTags: state.app.getIn(['googleAds', 'gptBannedTags']),
            };
        },
        dispatch => {
            return {
                requestData: args =>
                    dispatch(fetchDataSagaActions.requestData(args)),
            };
        }
    )(PostsIndex),
};
