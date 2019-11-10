/* eslint react/prop-types: 0 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import tt from 'counterpart';
import { INTERLEAVE_PROMOTED, TAG_LIST } from 'app/client_config';
import SidebarMenu from 'app/components/elements/SidebarMenu';
import { LIQUID_TOKEN_UPPERCASE } from 'app/client_config';
import Info from 'app/components/elements/Info';
import { getDate } from 'app/utils/Date';
import Slider from 'react-slick';
import PostPanel from 'app/components/modules/PostPanel';

class Dashboard extends React.Component {
    static propTypes = {
        discussions: PropTypes.object,
        accounts: PropTypes.object,
        status: PropTypes.object,
        routeParams: PropTypes.object,
        // requestData: PropTypes.func,
        loading: PropTypes.bool,
        username: PropTypes.string,
        blogmode: PropTypes.bool,
        categories: PropTypes.object,
        voteRegenSec: PropTypes.number,
        rewardData: PropTypes.object,
    };

    constructor() {
        super();
        this.state = {};
    }

    render() {
        const { username } = this.props.routeParams;
        const { accounts, voteRegenSec, rewardData, content } = this.props;
        const account = accounts.get(username);

        // do not render if account is not loaded or available
        if (!account) return null;

        const tokenStatus = account.has('token_status')
            ? account.get('token_status').toJS()
            : {
                  pending_token: 0,
              };

        const precision = tokenStatus['precision'];
        const totalEarning =
            tokenStatus['earned_token'] / Math.pow(10, precision);
        const votingPower =
            Math.min(
                tokenStatus['voting_power'] +
                    (new Date() - getDate(tokenStatus['last_vote_time'])) *
                        10000 /
                        (1000 * voteRegenSec),
                10000
            ) / 100;
        const resourceCredits = 100.0 * account.get('rc');

        // calculate vote value
        const applyRewardsCurve = r =>
            Math.pow(Math.max(0, r), rewardData.author_curve_exponent) *
            rewardData.reward_pool /
            rewardData.pending_rshares;
        const stakedTokens = tokenStatus['staked_tokens'];
        const rshares = stakedTokens;
        const scotDenom = Math.pow(10, precision);
        const voteValue = Number(
            (applyRewardsCurve(rshares) / scotDenom).toFixed(precision)
        );

        const { nightmodeEnabled } = this.props;
        const oppositeTheme = nightmodeEnabled ? 'theme-light' : 'theme-dark';

        const layoutClass = this.props.blogmode
            ? ' layout-block'
            : ' layout-list';

        const mqLarge =
            process.env.BROWSER &&
            window.matchMedia('screen and (min-width: 75em)').matches;

        var settings = {
            dots: true,
            infinite: true,
            speed: 500,
            slidesToShow: 4,
            slidesToScroll: 1,
        };

        return (
            <div className={'Dashboard row' + layoutClass}>
                <article className="articles">
                    <div>
                        <Slider {...settings}>
                            <div>
                                <Info
                                    description={tt('g.total_earning')}
                                    amount={totalEarning}
                                    unit={LIQUID_TOKEN_UPPERCASE}
                                    background="#2BB4F2"
                                    icon="bank"
                                />
                            </div>
                            <div>
                                <Info
                                    description={tt('g.voting_power')}
                                    amount={votingPower}
                                    unit="%"
                                    background="#5F6CBC"
                                    icon="flash"
                                />
                            </div>
                            <div>
                                <Info
                                    description={tt('g.resource_credits')}
                                    amount={resourceCredits}
                                    unit="%"
                                    background="#29A49A"
                                    icon="battery"
                                />
                            </div>
                            <div>
                                <Info
                                    description={tt('g.vote_value')}
                                    amount={voteValue}
                                    unit={LIQUID_TOKEN_UPPERCASE}
                                    background="#79919C"
                                    icon="dollar"
                                />
                            </div>
                        </Slider>
                    </div>
                    <div className="buttons">
                        <a
                            href="https://dex.steemleo.com"
                            target="_blank"
                            className="dex"
                        >
                            {tt('g.steemleo_dex')}
                        </a>
                        <a
                            href={`/@${username}/transfers`}
                            target="_blank"
                            className="wallet"
                        >
                            {tt('g.wallet')}
                        </a>
                    </div>

                    <div className="row posts">
                        <div className="column">
                            <PostPanel account={username} category="vote" />
                        </div>
                        <div className="column">
                            <PostPanel account={username} category="feed" />
                        </div>
                        <div className="column">
                            <PostPanel account={username} category="blog" />
                        </div>
                    </div>
                </article>

                <aside className="c-sidebar c-sidebar--left">
                    <div className={`avatar ${oppositeTheme}`}>
                        <img
                            src={`https://steemitimages.com/u/${
                                username
                            }/avatar`}
                        />
                    </div>
                    <SidebarMenu
                        username={username}
                        className={oppositeTheme}
                    />
                </aside>
            </div>
        );
    }
}

module.exports = {
    path: '@:username/dashboard',
    component: connect((state, ownProps) => {
        const scotConfig = state.app.get('scotConfig');

        const rewardData = {
            pending_rshares: scotConfig.getIn(['info', 'pending_rshares']),
            reward_pool: scotConfig.getIn(['info', 'reward_pool']),
            author_curve_exponent: scotConfig.getIn([
                'config',
                'author_curve_exponent',
            ]),
        };

        const content = state.global.get('content');

        return {
            discussions: state.global.get('discussion_idx'),
            status: state.global.get('status'),
            loading: state.app.get('loading'),
            accounts: state.global.get('accounts'),
            username:
                state.user.getIn(['current', 'username']) ||
                state.offchain.get('account'),
            blogmode: state.app.getIn(['user_preferences', 'blogmode']),
            // sortOrder: ownProps.params.order,
            // topic: ownProps.params.category,
            categories: TAG_LIST,
            pinned: state.offchain.get('pinned_posts'),
            maybeLoggedIn: state.user.get('maybeLoggedIn'),
            isBrowser: process.env.BROWSER,
            notices: state.offchain
                .get('pinned_posts')
                .get('notices')
                .toJS(),
            gptEnabled: state.app.getIn(['googleAds', 'gptEnabled']),
            tokenStats: scotConfig.getIn(['config', 'tokenStats']),
            reviveEnabled: state.app.get('reviveEnabled'),
            nightmodeEnabled: state.app.getIn([
                'user_preferences',
                'nightmode',
            ]),
            voteRegenSec: scotConfig.getIn(
                ['config', 'vote_regeneration_seconds'],
                5 * 24 * 60 * 60
            ),
            rewardData,
            content,
        };
    })(Dashboard),
};
