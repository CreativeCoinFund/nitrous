import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import tt from 'counterpart';
import { HIVE_ENGINE, LIQUID_TOKEN_UPPERCASE } from 'app/client_config';
import * as appActions from 'app/redux/AppReducer';
import CloseButton from 'app/components/elements/CloseButton';
import Icon from 'app/components/elements/Icon';
import { Link } from 'react-router';
import { SIGNUP_URL } from 'shared/constants.js';

const SidePanel = ({
    alignment,
    visible,
    hideSidePanel,
    username,
    walletUrl,
    scotTokenSymbol,
    useHive,
    toggleNightmode,
}) => {
    if (process.env.BROWSER) {
        visible && document.addEventListener('click', hideSidePanel);
        !visible && document.removeEventListener('click', hideSidePanel);
    }

    const loggedIn =
        username === undefined
            ? 'show-for-small-only'
            : 'SidePanel__hide-signup';

    const makeLink = (i, ix, arr) => {
        // A link is internal if it begins with a slash
        const isExternal = !i.link.match(/^\//) || i.isExternal;
        const cn = ix === arr.length - 1 ? 'last' : null;
        if (isExternal) {
            return (
                <li key={ix} className={cn}>
                    <a href={i.link} target="_blank" rel="noopener noreferrer">
                        {i.label}&nbsp;<Icon name="extlink" />
                    </a>
                </li>
            );
        }
        if (i.onClick) {
            return (
                <li key={ix} className={cn}>
                    <a onClick={i.onClick}>{i.label}</a>
                </li>
            );
        }
        return (
            <li key={ix} className={cn}>
                <Link to={i.link}>{i.label}</Link>
            </li>
        );
    };

    const sidePanelLinks = {
        internal: [],

        external: [],
        organizational: [
            {
                value: 'engine',
                label: 'Market',
                link: `https://tribaldex.com/trade/${scotTokenSymbol}`,
            },
            {
                value: 'lassevideos',
                label: 'Videos',
                link: '/videos',
                internal: true,
            },
            {
                value: 'lassenfts',
                label: 'NFTs',
                link: '/nfts',
                internal: true,
            },
            {
                value: 'lasseshop',
                label: 'Shop',
                link: '/shop',
                internal: true,
            },
            {
                value: 'lassepromo',
                label: 'Promotion',
                link: '/promotion',
                internal: true,
            },
            {
                value: 'lassediscord',
                label: 'Discord',
                link: 'https://discord.gg/5JW2w9t',
            },
            {
                value: 'lassefaq',
                label: 'FAQ',
                link: '/faq',
                internal: true,
            },
            {
                value: 'lassecashinfo',
                label: 'About',
                link: '/welcome',
                internal: true,
            },
            {
                value: 'lassecashwitness',
                label: 'Witness',
                link: 'https://primersion.com/he-witnesses',
            },
            {
                value: 'lassedswap',
                label: 'Dswap',
                link: 'https://dswap.trade',
            },
        ],

        legal: [
            {
                label: tt('navigation.privacy_policy'),
                link: '/privacy.html',
            },
            {
                label: tt('navigation.terms_of_service'),
                link: '/tos.html',
            },
        ],

        extras: [
            {
                label: tt('g.sign_in'),
                link: '/login.html',
            },
            {
                label: tt('g.sign_up'),
                link: SIGNUP_URL,
            },
            {
                value: 'post',
                label: tt('g.post'),
                link: '/submit.html',
            },
        ],
    };

    return (
        <div className="SidePanel">
            <div className={(visible ? 'visible ' : '') + alignment}>
                <CloseButton onClick={hideSidePanel} />
                <ul className={`vertical menu ${loggedIn}`}>
                    {sidePanelLinks.extras.map(makeLink)}
                </ul>
                <ul className="vertical menu">
                    <li>
                        <a className="menu-section">Community</a>
                    </li>
                    {sidePanelLinks['organizational'].map(makeLink)}
                </ul>
            </div>
        </div>
    );
};

SidePanel.propTypes = {
    alignment: PropTypes.oneOf(['left', 'right']).isRequired,
    visible: PropTypes.bool.isRequired,
    hideSidePanel: PropTypes.func.isRequired,
    username: PropTypes.string,
    toggleNightmode: PropTypes.func.isRequired,
};

SidePanel.defaultProps = {
    username: undefined,
};

export default connect(
    (state, ownProps) => {
        const walletUrl = state.app.get('walletUrl');
        const scotTokenSymbol = LIQUID_TOKEN_UPPERCASE;
        const useHive = HIVE_ENGINE;
        return {
            walletUrl,
            scotTokenSymbol,
            useHive,
            ...ownProps,
        };
    },
    dispatch => ({
        toggleNightmode: e => {
            if (e) e.preventDefault();
            dispatch(appActions.toggleNightmode());
        },
    })
)(SidePanel);
